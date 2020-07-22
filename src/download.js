export default function download(text, extension, base64=false) {
    const filename = window.prompt("Choose a file name", "export") + `.${extension}`;
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8" + (base64 ? ";base64" : "") + "," + encodeURIComponent(text));
    element.setAttribute("download", filename);

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}