export class Field {
	constructor(
		public std: boolean,
		public id: string,
		public label: string,
		public icon = "",
	) {}

	static standard: Field[] = [
		{std: true, id: "name2", label: "Syn", icon: ""},
		{std: true, id: "vernacularName", label: "NV", icon: ""},
		{std: true, id: "vernacularName2", label: "NV2", icon: ""},
		{std: true, id: "meaning", label: "Sense", icon: ""},
		{std: true, id: "noHerbier", label: "N° Herbier", icon: ""},
		{std: true, id: "herbariumPicture", label: "Herbarium Picture", icon: ""},
		{std: true, id: "website", label: "Website", icon: ""},
	];
}
