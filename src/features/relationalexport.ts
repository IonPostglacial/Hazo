import { escape } from "@/tools/parse-csv";
import JSZip from "jszip";
import { EncodedDataset } from "./codec";
import { picturesFromPhotos, standardUnits } from "@/datatypes";

const DocumentColumns = ["ref", "path", "doc_order", "name", "details"];
const LangColumns = ["ref", "name"];
const DocumentTranslationsColumns = ["document_ref", "lang_ref", "name", "details"];
const CategoricalCharacterColumns = ["document_ref", "color"];
const UnitColumns = ["ref", "base_unit_ref", "to_base_unit_factor"];
const MeasurementCharacterColumns = ["document_ref", "color", "unit_ref"];
const StateColumns = ["document_ref", "color"];
const DocumentAttachmentColumns = ["ref", "document_ref", "source", "path"];
const BookColumns = ["document_ref", "isbn"];
const DescriptorVisibilityRequirementColumns = ["descriptor_ref", "required_descriptor_ref"];
const DescriptorVisibilityInapplicableColumns = ["descriptor_ref", "required_descriptor_ref"];
const TaxonColumns = ["document_ref", "author", "website", "meaning", "herbarium_no", "herbarium_picture", "fasc", "page"];
const TaxonMeasurementColumns = ["taxon_ref", "character_ref", "minimum", "maximum"];
const TaxonDescriptionColumns = ["taxon_ref", "description_ref"];
const BookInfoColumns = ["taxon_ref", "book_ref", "fasc", "page", "details"];
const SpecimenLocationColumns = ["taxon_ref", "specimen_index", "latitude", "longitude"];

export function datasetToCsvZip(dataset: EncodedDataset): Promise<Blob> {
    const csvFiles = {
        document: [DocumentColumns],
        lang: [LangColumns, ["V", "Vernacular"], ["CN", "Chinese"], ["EN", "English"], ["FR", "French"], ["V2", "Vernacular 2"], ["S2", "Name 2"]],
        document_translation: [DocumentTranslationsColumns],
        categorical_character: [CategoricalCharacterColumns],
        unit: [UnitColumns],
        measurement_character: [MeasurementCharacterColumns],
        state: [StateColumns],
        document_attachment: [DocumentAttachmentColumns],
        book: [BookColumns],
        descriptor_visibility_requirement: [DescriptorVisibilityRequirementColumns],
        descriptor_visibility_inapplicable: [DescriptorVisibilityInapplicableColumns],
        taxon: [TaxonColumns],
        taxon_measurement: [TaxonMeasurementColumns],
        taxon_description: [TaxonDescriptionColumns],
        taxon_book_info: [BookInfoColumns],
        taxon_specimen_location: [SpecimenLocationColumns],
    };
    let order = 0;
    for (const [ref, unit] of Object.entries(standardUnits)) {
        csvFiles.unit.push([ref, unit.base?.unit.name.S ?? "", `${unit.base?.factor ?? ""}`]);
    }
    for (const book of dataset.books) {
        order++;
        csvFiles.document.push([book.id, book.path.join("."), `${order}`, book.label, ""]);
        csvFiles.book.push([book.id, ""]);
    }
    for (const character of dataset.characters) {
        order++;
        csvFiles.document.push([character.id, character.path.join("."), `${order}`, character.name, character.detail]);
        if (character.nameCN) {
            csvFiles.document_translation.push([character.id, "CN", character.nameCN, ""]);
        }
        if (character.nameEN) {
            csvFiles.document_translation.push([character.id, "EN", character.nameEN, ""]);
        }
        for (const pic of picturesFromPhotos(character, character.photos)) {
            order++;
            csvFiles.document_attachment.push([pic.id, character.id, pic.url, pic.hubUrl ?? ""]);
        }
        if (character.characterType === "discrete") {
            csvFiles.categorical_character.push([character.id, character.color ?? ""]);
        }
        if (character.characterType === "range") {
            csvFiles.measurement_character.push([character.id, character.color ?? "", character.unit ?? ""]);
        }
        for (const stateId of character.inapplicableStatesIds) {
            csvFiles.descriptor_visibility_inapplicable.push([character.id, stateId]);
        }
        for (const stateId of character.requiredStatesIds) {
            csvFiles.descriptor_visibility_requirement.push([character.id, stateId]);
        }
    }
    for (const state of dataset.states) {
        order++;
        csvFiles.document.push([state.id, state.path.join("."), `${order}`, state.name, state.description ?? ""]);
        if (state.nameCN) {
            csvFiles.document_translation.push([state.id, "CN", state.nameCN, ""]);
        }
        if (state.nameEN) {
            csvFiles.document_translation.push([state.id, "EN", state.nameEN, ""]);
        }
        csvFiles.state.push([state.id, state.color ?? ""]);
        for (const pic of state.photos) {
            order++;
            csvFiles.document_attachment.push([pic.id, state.id, pic.url, pic.hubUrl ?? ""]);
        }
    }
    for (const taxon of dataset.taxons) {
        order++;
        csvFiles.document.push([taxon.id, taxon.path.join("."), `${order}`, taxon.name, taxon.detail]);
        if (taxon.vernacularName) {
            csvFiles.document_translation.push([taxon.id, "V", taxon.vernacularName, ""]);
        }
        if (taxon.nameCN) {
            csvFiles.document_translation.push([taxon.id, "CN", taxon.nameCN, ""]);
        }
        if (taxon.nameEN) {
            csvFiles.document_translation.push([taxon.id, "EN", taxon.nameEN, ""]);
        }
        if (taxon.name2) {
            csvFiles.document_translation.push([taxon.id, "S2", taxon.name2, ""]);
        }
        if (taxon.vernacularName2) {
            csvFiles.document_translation.push([taxon.id, "V2", taxon.vernacularName2, ""]);
        }
        csvFiles.taxon.push([taxon.id, taxon.author, taxon.website, taxon.meaning, taxon.noHerbier ?? "", taxon.herbariumPicture, taxon.fasc, taxon.page]);
        for (const pic of taxon.photos) {
            order++;
            csvFiles.document_attachment.push([pic.id, taxon.id, pic.url, pic.hubUrl ?? ""]);
        }
        for (const [bookRef, bookInfo] of Object.entries(taxon.bookInfoByIds ?? {})) {
            csvFiles.taxon_book_info.push([taxon.id, bookRef, bookInfo.fasc, bookInfo.page, bookInfo.detail]);
        }
        for (const mesurement of taxon.measurements) {
            csvFiles.taxon_measurement.push([taxon.id, mesurement.character, `${mesurement.min ?? ""}`, `${mesurement.max ?? ""}`]);
        }
        for (const description of taxon.descriptions) {
            for (const stateId of description.statesIds) {
                csvFiles.taxon_description.push([taxon.id, stateId]);
            }
        }
        for (const [index, location] of taxon.specimenLocations?.entries() ?? []) {
            csvFiles.taxon_specimen_location.push([taxon.id, `${index}`, `${location.lat ?? ""}`, `${location.lng ?? ""}`]);
        }
    }
    const zip = new JSZip();

    for (const [fileName, fileData] of Object.entries(csvFiles)) {
        const content = fileData.map(row => row.map(col => col === "" ? "" : escape(col)).join(",")).join("\n");
        zip.file(`${fileName}.csv`, content);
    }
	return zip.generateAsync({type:"blob"});
}