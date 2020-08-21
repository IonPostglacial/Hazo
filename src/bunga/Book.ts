export class Book {
    constructor(
        public id: string,
        public label: string,
    ) {}

    static standard: Book[] = [
        {id: "fmc", label: "Flore de Madagascar et Comores"},
        {id: "mbf", label: "Manuel de Botanique Forestière"},
    ];

}