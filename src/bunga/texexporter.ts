import JSZip from "jszip";
import { Character, Description, Taxon } from "./datatypes";
import { generateFileName } from "./generatefilename";
import { taxonDescriptions } from "./Taxon";

export class TexExporter {
    taxons: Taxon[];
    characters: Iterable<Character>;
    photos: string[];
    pictureNameByUrl: Map<string, string>;
    progressListeners: ((progress: number, progressMax: number) => void)[];

    constructor(taxons: Taxon[], characters: Iterable<Character>) {
        this.taxons = taxons;
        this.characters = characters;
        this.progressListeners = [];
        this.pictureNameByUrl = new Map();
        this.photos = [];
        for (const taxon of taxons) {
            if (taxon.photos.length > 0) {
                const photo = taxon.photos[0];
                this.pictureNameByUrl.set(photo, generateFileName(taxon.name) + ".jpg");
                this.photos.push(photo);
            }
        }
    }

    picture(urls: string[]) {
        return this.pictureNameByUrl.get(urls[0]);
    }

    onProgress(listener: (progress: number, progressMax: number) => void) {
        this.progressListeners.push(listener);
    }

    progressed(progress: number, progresMax: number) {
        for (const listener of this.progressListeners) {
            listener(progress, progresMax);
        }
    }

    private _generateTex(): string {
        const descriptionTemplate = (description: Description) => `
            \\item ${description.character.name}: ${description.states.map(s => s.name).join(" ")}
        `;

        const taxonTemplate = (taxon: Taxon) => `
            \\begin{frame}
            \\frametitle{${taxon.name}}
            \\framesubtitle{${taxon.vernacularName}}
            \\begin{block}{Identification}
            ${ this.photos.length > 0 ? `\\includegraphics[width=3cm,height=3cm]{${this.picture(taxon.photos)}}` : "" }
            \\begin{itemize}
            \\item name: ${taxon.name}
            \\item vernacular name: ${taxon.vernacularName}
            \\item chinese name: ${taxon.nameCN}
            \\end{itemize}
            \\end{block}
            \\begin{block}{Description}
            \\begin{itemize}
            ${taxonDescriptions(taxon, this.characters).map(descriptionTemplate).join("\n")}
            \\end{itemize}
            \\end{block}
        \\end{frame}
        `;

        return `
            \\documentclass{beamer}

            \\usetheme{PaloAlto}
            \\usepackage[french]{babel}
            \\usepackage[utf8]{inputenc}
            \\usepackage{graphicx}

            \\definecolor{Green}{rgb}{.1,.72,.1}

            \\title{Taxons}
            \\author{Tian Li} %
            \\institute{Muséum National d'Histoire Naturelle}
            %\\date{2020}

            \\begin{document}

            %{% open a Local TeX Group
            %\\setbeamertemplate{sidebar}{}
            % \\begin{frame}
            %         \\titlepage
            %         \\begin{center}
            %           \\includegraphics[width=3cm]{sigmalis.png}
            %         \\end{center}
            % \\end{frame}
            %}% end Local TeX Group

            \\section{Taxons}

            ${this.taxons.map(taxonTemplate).join("\n")}

            \\end{document}
        `;
    }

    export():Promise<Blob> {
        const zip = new JSZip();

        const texFileContent = this._generateTex();

        const texFolder = zip.folder("latex");
        texFolder?.file("export.tex", texFileContent);

        return new Promise((resolve, reject) => {
            let semaphore = this.photos.length;

            const semDec = () => {
                semaphore--;
                this.progressed(this.photos.length - semaphore, this.photos.length);
                if (semaphore === 0) {
                    resolve(zip.generateAsync({type: "blob"}));
                }
            }

            for (const photo of this.photos) {
                const rq = new XMLHttpRequest();
                rq.open("GET", photo);
                rq.responseType = "blob";
                rq.onload = (bytes) => {
                    const pictureName = this.pictureNameByUrl.get(photo);

                    if (!pictureName) return;

                    texFolder?.file(pictureName, rq.response);
                    semDec();
                }
                rq.onerror = (msg) => {
                    console.log(`error: ${msg}`);
                    semDec();
                };
                rq.send();
            }
        });
    }
}