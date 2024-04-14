"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfileKeypairPath = void 0;
const constants_1 = require("../../common/constants");
const getProfileKeypairPath = (profile) => constants_1.keypairPaths[profile];
exports.getProfileKeypairPath = getProfileKeypairPath;
