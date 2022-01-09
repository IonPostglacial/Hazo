import { CategoricalRef, Character, Dataset, MediaObject, MediaObjectRef, Representation, State, Taxon } from "./datatypes";
import { SddException, SddRefException } from "./exceptions";

interface TaxonHierarchy {
	taxon: Taxon|undefined;
	childrenHierarchyIds: string[];
}

interface CharactersAndStatesById {
	charactersById: Map<string, Character>;
	statesById: Map<string, State>;
}

function isNullOrUndefined<T>(value: T|undefined|null): value is undefined|null {
    return typeof value === "undefined" || value === null;
}

function isEmptyString(s: string): boolean {
    return isNullOrUndefined(s) || s === "";
}

function assertNotNull<T>(value: T|undefined|null, exception:SddException): T {
    if (isNullOrUndefined(value)) {
        throw exception;
    } else {
        return value;
    }
}

function firstChildNamed(element: Element, name: string): Element|undefined {
    for (let i = 0; i < element.children.length; i++) {
        if (element.children[i].nodeName === name) return element.children[i];
    }
    return undefined;
}

function forEachChildrenNamed(element: Element, name: string, callback: (element: Element) => void): void {
    for (let i = 0; i < element.children.length; i++) {
        if (element.children[i].nodeName === name) {
            callback(element.children[i]);
        }
    }
}

function assignRepresentation(r1: Representation, r2: Representation|undefined) {
    if (typeof r2 === "undefined")
        return;
    if (!isEmptyString(r2.label))
        r1.label = r2.label;
    if (!isEmptyString(r2.detail))
        r1.detail = r2.detail;
    if (!isNullOrUndefined(r2.mediaObjectsRefs) && r2.mediaObjectsRefs.length > 0)
        r1.mediaObjectsRefs = r2.mediaObjectsRefs;
}

export class Loader {
	strictMode: boolean;
    exceptionLog: string[] = [];

	constructor(strictMode = true) {
		this.strictMode = strictMode;
	}

	loadDataset(datasetElement: Element): Dataset {
		const mediaObjectsById = this.loadMediaObjects(datasetElement);
		const charsAndStatesById = this.loadCharacters(datasetElement, mediaObjectsById);

		return {
			taxons: [...this.loadTaxons(datasetElement, mediaObjectsById, charsAndStatesById.charactersById).values()],
			characters: [...charsAndStatesById.charactersById.values()],
			states: [...charsAndStatesById.statesById.values()],
			mediaObjects: [...mediaObjectsById.values()],
		};
	}

	loadMediaObjects(datasetElement: Element):Map<string, MediaObject> {
		const mediaObjectsElement = firstChildNamed(datasetElement, "MediaObjects");
		const mediaObjectsById = new Map<string, MediaObject>();

		if (typeof mediaObjectsElement === "undefined") {
			return mediaObjectsById;
        }
        forEachChildrenNamed(mediaObjectsElement, "MediaObject", (mediaObjectElement) => {
			const sourceElement = firstChildNamed(mediaObjectElement, "Source");

			if (typeof sourceElement !== "undefined") {
				const id = assertNotNull(mediaObjectElement.getAttribute("id"), new SddException("A MediaObject declaration misses its 'id'."));
				const representation = this.loadRepresentation(firstChildNamed(mediaObjectElement, "Representation"), mediaObjectsById);

				mediaObjectsById.set(id, {
					id: id,
					source: sourceElement.getAttribute("href") ?? "",
					label: representation.label,
					detail: representation.detail
				});
			}
        });
		return mediaObjectsById;
	}

	loadRepresentation(representationElement: Element|undefined, mediaObjectsByRef:Map<string, MediaObject>):Representation {
		if (typeof representationElement === "undefined") {
			return {
				mediaObjectsRefs: [],
				label: "",
				detail: "",
			};
        }
		const mediaObjectsRefs: MediaObjectRef[] = [];

        forEachChildrenNamed(representationElement, "MediaObject", (mediaObjectElement) => {
            mediaObjectsRefs.push({ ref: assertNotNull(mediaObjectElement.getAttribute("ref"), new SddException("A MediaObject is missing its ref.")) });
        });
		const labelNode = firstChildNamed(representationElement, "Label");
		const detailElement = firstChildNamed(representationElement, "Detail");

		return {
			label: labelNode?.textContent ?? "_",
			detail: detailElement?.textContent ?? "_",
			mediaObjectsRefs: mediaObjectsRefs
		};
	}

	logException(exception:SddException) {
		this.exceptionLog.push(exception.toString());
	}

	loadTaxons(datasetElement: Element, mediaObjectsById:Map<string, MediaObject>, charactersById:Map<string, Character>):Map<string, Taxon> {
		const taxonsById = new Map<string, Taxon>();
		const taxonNamesElement = firstChildNamed(datasetElement, "TaxonNames");

		if (typeof taxonNamesElement === "undefined") {
            return taxonsById;
        }
        forEachChildrenNamed(taxonNamesElement, "TaxonName", (taxonElement) => {
            const taxonId = assertNotNull(taxonElement.getAttribute("id"), new SddException("A Taxon is missing its 'id'."));

            taxonsById.set(taxonId, Object.assign({ id: taxonId, hid: "", categoricals: [], childrenIds: [] }, this.loadRepresentation(firstChildNamed(taxonElement, "Representation"), mediaObjectsById)));
        });

		const codedDescriptionsElement = firstChildNamed(datasetElement, "CodedDescriptions");

		if (typeof codedDescriptionsElement !== "undefined") {
			forEachChildrenNamed(codedDescriptionsElement, "CodedDescription", (codedDescriptionElement) => {
				try {
					const scopeElement = assertNotNull(firstChildNamed(codedDescriptionElement, "Scope"),
						new SddException("A CodedDescription is missing its 'Scope'."));
                    const taxonNameElement = assertNotNull(firstChildNamed(scopeElement, "TaxonName"),
                        new SddException("A CodedDescription Scope doesn't have a 'Taxon' element, which is the only one supported by this loader."));
					const taxonId = assertNotNull(taxonNameElement.getAttribute("ref"), new SddException("A TaxonName is missing its 'ref'."));
					const representation = this.loadRepresentation(firstChildNamed(codedDescriptionElement, "Representation"), mediaObjectsById);
					const taxonToAugment = assertNotNull(taxonsById.get(taxonId), new SddRefException("Scope > TaxonName", "Taxon", taxonId));

                    assignRepresentation(taxonToAugment, representation);

					const summaryDataElement = firstChildNamed(codedDescriptionElement, "SummaryData");

					if (typeof summaryDataElement !== "undefined") {
                        forEachChildrenNamed(summaryDataElement, "Categorical", (categoricalElement) => {
							const categorical: CategoricalRef = {
								ref: assertNotNull(categoricalElement.getAttribute("ref"), new SddException("A Categorical is missing its 'ref'.")),
								stateRefs: []
                            };
                            forEachChildrenNamed(categoricalElement, "State", (stateElement) => {
								const stateId = assertNotNull(stateElement.getAttribute("ref"), new SddException("A State is missing its 'ref'."));
								categorical.stateRefs.push({ ref: stateId });
                            });
							taxonToAugment.categoricals.push(categorical);
                        });
					}
				} catch (e: any) {
					if (this.strictMode) {
						throw e;
					} else {
						this.logException(e);
					}
                }
            });
		}

		const taxonHierarchiesElement = firstChildNamed(datasetElement, "TaxonHierarchies");
        let taxonHierarchyElement: Element|undefined = undefined;
        if (typeof taxonHierarchiesElement !== "undefined") {
			taxonHierarchyElement = firstChildNamed(taxonHierarchiesElement, "TaxonHierarchy");
		}
        let nodesElement: Element|undefined = undefined;
        if (typeof taxonHierarchyElement !== "undefined") {
			nodesElement = firstChildNamed(taxonHierarchyElement, "Nodes");
		}
		if (typeof nodesElement !== "undefined") {
			const hierarchiesById = new Map<string, TaxonHierarchy>();

            forEachChildrenNamed(nodesElement, "Node", (nodeElement) => {
				try {
                    const hierarchyId = assertNotNull(nodeElement.getAttribute("id"),
                        new SddException("A TaxonHierarchy > Nodes > Node is missing its 'id'."));
					const taxonNameElement = assertNotNull(firstChildNamed(nodeElement, "TaxonName"),
						new SddException("A TaxonHierarchy > Nodes > Node is missing its 'TaxonName'."));
					const taxonId = assertNotNull(taxonNameElement.getAttribute("ref"),
						new SddException("A TaxonHierarchy > Nodes > Node > TaxonName is missing its 'ref'."));
                    const taxon = assertNotNull(taxonsById.get(taxonId),
                        new SddRefException("TaxonHierarchy > Nodes > Node > TaxonName", "Taxons", taxonId));
					let hierarchy = hierarchiesById.get(hierarchyId);

					taxon.hid = hierarchyId;

					if (typeof hierarchy === "undefined") {
						hierarchy = {taxon: taxon, childrenHierarchyIds: []};
					} else {
						hierarchy.taxon = taxon;
					}
					hierarchiesById.set(hierarchyId, hierarchy);

					const parentElement = firstChildNamed(nodeElement, "Parent");

					if (typeof parentElement !== "undefined") {
                        const parentId = assertNotNull(parentElement.getAttribute("ref"),
                            new SddException("A TaxonHierarchy >> Parent is missing its 'ref'."));
						let parent = hierarchiesById.get(parentId);
						if (typeof parent === "undefined") {
							parent = { taxon: undefined, childrenHierarchyIds: [hierarchyId]};
							hierarchiesById.set(parentId, parent);
						} else {
							parent.childrenHierarchyIds.push(hierarchyId);
						}
					}
				} catch (e: any) {
					if (this.strictMode) {
						throw e;
					} else {
						this.logException(e);
					}
				}
            });

			for (const hierarchy of hierarchiesById.values()) {
				if (typeof hierarchy.taxon === "undefined") {
                    console.error(hierarchy);
                }
				const augmentedTaxon = hierarchy.taxon;

				for (const hid of hierarchy.childrenHierarchyIds) {
                    const child = hierarchiesById.get(hid)?.taxon;
                    if (typeof child !== "undefined" && typeof augmentedTaxon !== "undefined") {
                        child.parentId = augmentedTaxon.id;
                        augmentedTaxon.childrenIds.push(child.id);
                    }
				}
			}
		}
		return taxonsById;
	}

	loadCharacters(datasetElement: Element, mediaObjectsById:Map<string, MediaObject>): CharactersAndStatesById {
		const charactersById = new Map<string, Character>();
		const charactersElements = firstChildNamed(datasetElement, "Characters");
		const statesById = new Map<string, State>();

		if (typeof charactersElements === "undefined")
			return { charactersById: charactersById, statesById: statesById };

		for (const characterElement of charactersElements.children) {
			try {
				if (characterElement.nodeName !== "CategoricalCharacter" && characterElement.nodeName !== "QuantitativeCharacter") {
					continue;
				}
				const characterId = assertNotNull(characterElement.getAttribute("id"), new SddException("A Character is missing its 'id'."));
				const statesElement = firstChildNamed(characterElement, "States");
				const states: State[] = [];

				if (typeof statesElement !== "undefined") {
                    forEachChildrenNamed(statesElement, "StateDefinition", (stateElement) => {
						const stateId = assertNotNull(stateElement.getAttribute("id"), new SddException("A State is missing its 'id'"));
                        const state: State = Object.assign({ id: stateId, characterId },
                            this.loadRepresentation(firstChildNamed(stateElement, "Representation"), mediaObjectsById));
						statesById.set(stateId, state);
						states.push(state);
                    });
				}

				charactersById.set(characterId,
                    Object.assign({ id: characterId, states, inapplicableStatesRefs: [], childrenIds: [] },
                        this.loadRepresentation(firstChildNamed(characterElement, "Representation"), mediaObjectsById)));
			} catch (e: any) {
				if (this.strictMode) {
					throw e;
				} else {
					this.logException(e);
				}
			}
		}
		const characterTreesElement = firstChildNamed(datasetElement, "CharacterTrees");

		if (typeof characterTreesElement !== "undefined") {
            forEachChildrenNamed(characterTreesElement, "CharacterTree", (characterTreeElement) => {
                const nodesElement = firstChildNamed(characterTreeElement, "Nodes");

                if (typeof nodesElement !== "undefined") {
                    forEachChildrenNamed(nodesElement, "CharNode", (charNodeElement) => {
                        try {
                            const characterElement = assertNotNull(firstChildNamed(charNodeElement, "Character"),
                                new SddException("A CharNode is missing its 'Character'."));
                            const characterRef = assertNotNull(characterElement.getAttribute("ref"),
                                new SddException("A CharNode > Character is missing its 'ref."));
                            const augmentedCharacter = assertNotNull(charactersById.get(characterRef),
                                new SddRefException("CharNode > Character", "Character", characterRef));
                            const dependencyRulesElement = firstChildNamed(charNodeElement, "DependencyRules");

                            if (typeof dependencyRulesElement !== "undefined") {
                                const inapplicableIfElement = firstChildNamed(dependencyRulesElement, "InapplicableIf");

                                if (typeof inapplicableIfElement !== "undefined") {
                                    forEachChildrenNamed(inapplicableIfElement, "State", (stateElement) => {
                                        const stateRef = assertNotNull(stateElement.getAttribute("ref"),
                                            new SddException("A InapplicableIf > State is missing its 'ref'."));
                                        const state = assertNotNull(statesById.get(stateRef),
                                            new SddRefException("InapplicableIf > State", "State", stateRef));
                                        augmentedCharacter.inapplicableStatesRefs.push({ ref: state.id });
                                        augmentedCharacter.parentId = state.characterId;
                                    });
                                }
                            }
                            if (typeof augmentedCharacter.parentId !== "undefined" && augmentedCharacter.inapplicableStatesRefs.length > 0) {
                                const parentCharacter = charactersById.get(augmentedCharacter.parentId);
                                if (typeof parentCharacter !== "undefined") {
                                    parentCharacter.childrenIds.push(augmentedCharacter.id);
                                }
                            }
                        } catch (e: any) {
                            if (this.strictMode) {
                                throw e;
                            } else {
                                this.logException(e);
                            }
                        }
                    });
                }
            });
		}
		return { charactersById: charactersById, statesById: statesById };
	}

	load(text: string): Dataset[] {
		const xml = new DOMParser().parseFromString(text, "text/xml");
		const datasetsElements = xml.firstElementChild;
        const datasets: Dataset[] = [];
        
        if (datasetsElements === null) {
            return datasets;
        }
        forEachChildrenNamed(datasetsElements, "Dataset", (datasetElement) => {
            datasets.push(this.loadDataset(datasetElement));
		});
		return datasets;
	}
}
