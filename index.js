import express from 'express'

const app = express()
const PORT = 9000

app.listen(PORT, () => {
    console.log(`Server listen on ${PORT}`)
})


const fs = require('fs');
const readline = require('readline');
const os = require('os');
const path = require('path');


const Max_Memory_FILE = 100000
const Temp_DIR = './temp_files'
const Input_FILE = 'large_file.txt'
const Output_FILE = 'sorted_file.txt'

if (fs.existsSync(Temp_DIR)) {
    fs.rmdirSync(Temp_DIR), { recursive: true }
}
fs.mkdirSync(Temp_DIR);

async function sortAndSave() {
    const inputStream = fs.createReadStream(Input_FILE)
    const rl = readline.createInterface({
        input: inputStream,
        crlfDelay: Infinity,

    });
    let current = [];
    let index = 0;

    for await (const line of rl) {
        current.push(line);

        if (current.length >= Max_Memory_FILE) {
            current.sort();
            fs.writeFileSync(path.join(Temp_DIR, `${index++}.txt`), current.join('\n'));
            current = []
        }
    }
    if (current.length > 0) {
        current.sort();
        fs.writeFileSync(path.join(Temp_DIR, `${index}.txt`), current.join('\n'));
    }
}

async function mergeSortFiles() {
    const files = fs.readdirSync(Temp_DIR).sort();
    const writeStream = fs.createWriteStream(Output_FILE);

    const streams = files.map((file) => fs.createReadStream(path
        .join(Temp_DIR, file))
        .pipe(readline.createInterface({
            input: fs.createReadStream(path.join(Temp_DIR, file)),
            crlfDelay: Infinity
        })));

    const dataObj = [];
    for (const stream of streams) {
        for await (const line of stream) {
            dataObj.push(line)
        }
    }
    dataObj.sort()
    writeStream.write(dataObj.join('\n'));
    writeStream.end();
}

async function main() {
    await sortAndSave(); 
    await mergeSortFiles(); 
}


main().then(() => {
    console.log('Сортировка завершена!');
}).catch((err) => {
    console.error('Ошибка:', err);
});