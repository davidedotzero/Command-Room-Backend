export function getOnlyDate(date) {
    return new Date(date.setHours(0, 0, 0, 0));
}
export function formatDateYYYY_MM_DD_Dashes(date) {
    return `${date.getFullYear().toString()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
    // getMonth() + 1 because it starts counting at 0 (January = 0) FOR SOME REASON GOD KNOWS WHY WHY CANT WE JUST NUKE THIS STUPID SHITTY ASS LANGUAGE FROM HUMANITY ALREADY
}
export function parseYYYYMMDD(dateString) {
    const year = parseInt(dateString.substring(0, 4), 10);
    const month = parseInt(dateString.substring(4, 6), 10);
    const day = parseInt(dateString.substring(6, 8), 10);
    // this will return Date with no time
    return new Date(year, month - 1, day);
}
export function toMySQLTimestamp(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
}
export function validateID(id) {
    // check for [ANYLETTERS]-[8 digits number]-[6 digits number]
    const idRegex = /^[^-]+-\d{8}-\d{6}$/;
    if (!idRegex.test(id)) {
        return false;
    }
    return true;
}
export function validateShortID(id) {
    // check for [ANYLETTERS]-[8 digits number]-[6 digits number]
    const idRegex = /^[^-]+-\d{4}-\d{6}$/;
    if (!idRegex.test(id)) {
        return false;
    }
    return true;
}
export function genSingleNewID(latestID) {
    if (!validateID(latestID)) {
        throw new Error(`Given ID ${latestID} does not match the format PREFIX-YYYYMMDD-XXXXX.`);
    }
    const split = latestID.split("-");
    const [prefix, strDate, strNum] = split;
    const idNum = Number(strNum);
    const idDate = parseYYYYMMDD(strDate);
    let newNum = null;
    let newDate = null;
    // parseYYYYMMDD will return Date() with no time so we can compare it directly like this
    if (idDate.getTime() === getOnlyDate(new Date()).getTime()) {
        newNum = idNum + 1;
        newDate = strDate;
    }
    else {
        newNum = 1; // reset id for new date
        const a = new Date();
        newDate = "" + a.getFullYear() + String(a.getMonth() + 1).padStart(2, "0") + String(a.getDate()).padStart(2, "0");
    }
    return `${prefix}-${newDate}-${String(newNum).padStart(6, "0")}`;
}
export function genSingleNewShortID(latestID) {
    if (!validateShortID(latestID)) {
        throw new Error(`Given ID ${latestID} does not match the format PREFIX-YYYY-XXXXX.`);
    }
    const split = latestID.split("-");
    const [prefix, strDate, strNum] = split;
    const idNum = Number(strNum);
    const idYear = Number(strDate);
    let newNum = null;
    let newYear = null;
    if (idYear === new Date().getFullYear()) {
        newNum = idNum + 1;
        newYear = strDate;
    }
    else {
        newNum = 1; // reset id for new date
        const a = new Date();
        newYear = "" + a.getFullYear();
    }
    return `${prefix}-${newYear}-${String(newNum).padStart(6, "0")}`;
}
export function genMultipleNewID(latestID, count) {
    if (!validateID(latestID)) {
        throw new Error(`Given ID ${latestID} does not match the format PREFIX-YYYYMMDD-XXXXX.`);
    }
    const split = latestID.split("-");
    const [prefix, strDate, strNum] = split;
    const idNum = Number(strNum);
    const idDate = parseYYYYMMDD(strDate);
    let startNum = null;
    let newDate = null;
    let ids = [];
    if (idDate.getTime() === getOnlyDate(new Date()).getTime()) {
        startNum = idNum + 1;
        newDate = strDate;
    }
    else {
        startNum = 1; // reset id for new date
        const a = new Date();
        newDate = "" + a.getFullYear() + String(a.getMonth() + 1).padStart(2, "0") + String(a.getDate()).padStart(2, "0");
    }
    for (let i = 0; i < count; i++) {
        ids.push(`${prefix}-${newDate}-${String(startNum + i).padStart(6, "0")}`);
    }
    return ids;
}
//# sourceMappingURL=util.js.map