import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.39.0/+esm';

const py_editor = monaco.editor.create(document.querySelector('.monaco_py'), {
    language: 'python', // Set language to Python
    theme: 'vs-light', // Set theme to dark
})

const json_editor = monaco.editor.create(document.querySelector('.monaco_json'), {
    language: 'javascript', // Set language to JSON
    theme: 'vs-light', // Set theme to dark
});

py_editor.setValue(`
def main():
    airfoil.aoa('degrees', [0, 360])
    time = 50
`);

json_editor.setValue(`
{
    "aoa": {
        "units": "degrees",
        "range": [0, 360]
    },
}
`);
