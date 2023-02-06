import JSZip from "jszip";
import { Dataset, Description, Picture, Taxon } from "@/datatypes";
import generateFileName from "./generatefilename";
import { join, map } from "@/tools/iter";

export function createTexExporter(d: Dataset) {
    const dataset = d;
    const progressListeners: ((progress: number, progressMax: number) => void)[] = [];
    const pictureNameByUrl = new Map<string, string>();
    const photos: string[] = [];
    for (const taxon of dataset.taxons) {
        if (taxon.pictures.length > 0) {
            const photo = taxon.pictures[0];
            pictureNameByUrl.set(photo.url, generateFileName(taxon.name.S) + ".jpg");
            photos.push(photo.url);
        }
    }

    function pic(pictures: Picture[]|undefined): string|undefined {
        if (typeof pictures === "undefined" || pictures.length === 0) {
            return undefined;
        } else {
            return pictureNameByUrl.get(pictures[0].url);
        }
    }

    function _generateTex(): string {
        const descriptionTemplate = (description: Description) => `
            \\item ${description.character.name}: ${description.states.map(s => s.name).join(" ")}
        `;

        const taxonTemplate = (taxon: Taxon) => `
            \\begin{frame}
            \\frametitle{${taxon.name}}
            \\framesubtitle{${taxon.name.V}}
            \\begin{block}{Identification}
            ${ photos.length > 0 ? `\\includegraphics[width=3cm,height=3cm]{${pic(taxon.pictures)}}` : "" }
            \\begin{itemize}
            \\item name: ${taxon.name}
            \\item vernacular name: ${taxon.name.V}
            \\item chinese name: ${taxon.name.CN}
            \\end{itemize}
            \\end{block}
            \\begin{block}{Description}
            \\begin{itemize}
            ${join(map(dataset.taxonDescriptions(taxon), descriptionTemplate), "\n")}
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

            ${join(map(dataset.taxons, taxonTemplate), "\n")}

            \\end{document}
        `;
    }

    function progressed(progress: number, progresMax: number) {
        for (const listener of progressListeners) {
            listener(progress, progresMax);
        }
    }

    return {
        onProgress(listener: (progress: number, progressMax: number) => void) {
            progressListeners.push(listener);
        },
        export():Promise<Blob> {
            const zip = new JSZip();

            const texFileContent = _generateTex();

            const texFolder = zip.folder("latex");
            texFolder?.file("export.tex", texFileContent);

            return new Promise((resolve, reject) => {
                let semaphore = photos.length;

                const semDec = () => {
                    semaphore--;
                    progressed(photos.length - semaphore, photos.length);
                    if (semaphore === 0) {
                        resolve(zip.generateAsync({type: "blob"}));
                    }
                }

                for (const photo of photos) {
                    const rq = new XMLHttpRequest();
                    rq.open("GET", photo);
                    rq.responseType = "blob";
                    rq.onload = (bytes) => {
                        const pictureName = pictureNameByUrl.get(photo);

                        if (!pictureName) return;

                        texFolder?.file(pictureName, rq.response);
                        semDec();
                    }
                    rq.onerror = (msg) => {
                        console.warn(`error: ${msg}`);
                        semDec();
                    };
                    rq.send();
                }
            });
        }
    };
}