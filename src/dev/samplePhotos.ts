// Bundled locally; no external image service is used at runtime.
const urls = [
  new URL("./samples/01.jpg", import.meta.url).href,
  new URL("./samples/02.jpg", import.meta.url).href,
  new URL("./samples/03.jpg", import.meta.url).href,
  new URL("./samples/04.jpg", import.meta.url).href,
  new URL("./samples/05.jpg", import.meta.url).href,
  new URL("./samples/06.jpg", import.meta.url).href,
  new URL("./samples/07.jpg", import.meta.url).href,
  new URL("./samples/08.jpg", import.meta.url).href,
  new URL("./samples/09.jpg", import.meta.url).href,
];

export async function loadSampleFiles(
  count: number,
  offset = 0,
): Promise<File[]> {
  return Promise.all(
    urls.slice(offset, offset + count).map(async (url, index) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Sample image missing");
      return new File(
        [await response.blob()],
        `PicPa-sample-${index + 1}.jpg`,
        {
          type: "image/jpeg",
        },
      );
    }),
  );
}
