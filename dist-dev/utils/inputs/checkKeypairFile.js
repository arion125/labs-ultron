"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkKeypairFile = void 0;
const fs_extra_1 = require("fs-extra");
const checkKeypairFile = (keypairPath) => {
    if (!(0, fs_extra_1.existsSync)(keypairPath))
        return { type: "KeypairFileNotFound" };
    const fileContent = (0, fs_extra_1.readFileSync)(keypairPath).toString();
    const encryptedKeypair = JSON.parse(fileContent);
    if (encryptedKeypair.iv &&
        encryptedKeypair.content &&
        encryptedKeypair.salt &&
        encryptedKeypair.tag)
        return { type: "Success" };
    return { type: "KeypairFileParsingError" };
};
exports.checkKeypairFile = checkKeypairFile;
