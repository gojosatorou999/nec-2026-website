const upload = (value) =>
  value &&
  typeof value === "object" &&
  typeof value.data === "string" &&
  /^data:(image\/(png|jpeg|webp)|application\/pdf);base64,/.test(value.data);
export function uploadLinks(record, base) {
  const convert = (value, suffix) =>
    upload(value)
      ? {
          ...value,
          data: base + suffix,
          mimeType: value.data.slice(5, value.data.indexOf(";")),
        }
      : value;
  return Object.fromEntries(
    Object.entries(record).map(([field, value]) => [
      field,
      Array.isArray(value)
        ? value.map((entry, index) =>
            convert(entry, "/" + encodeURIComponent(field) + "/" + index),
          )
        : convert(value, "/" + encodeURIComponent(field)),
    ]),
  );
}
export function sendUpload(res, record, field, index) {
  let value = record && Object.hasOwn(record, field) ? record[field] : null;
  if (index !== undefined)
    value =
      Array.isArray(value) && /^\d+$/.test(index) ? value[Number(index)] : null;
  if (!upload(value)) return res.status(404).json({ error: "File not found." });
  const mime = value.data.slice(5, value.data.indexOf(";"));
  res.type(mime).send(Buffer.from(value.data.split(",")[1], "base64"));
}
