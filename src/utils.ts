export async function delay(timeInSeconds: number) {
  await new Promise((resolve) => setTimeout(resolve, timeInSeconds * 1000));
}

export async function imageIsLessThanSize(url: string, maxSize: number) {
  let result = await fetch(url);
  let size = parseInt(result.headers.get("content-length") || "0", 10);
  if (size < maxSize) return true;
  console.log(`🚮 Image ${url} is larger than ${maxSize}, throwing it out.`);
  return false;
}

// export async function getImageSize(url: string) {
//   return new Promise((resolve, reject) => {
//     get(url, (res) => {
//       const { statusCode } = res;

//       if (statusCode !== 200) {
//         reject(new Error(`Failed to load image, status code: ${statusCode}`));
//       }

//       const contentLength = parseInt(res.headers["content-length"] || "0", 10);

//       if (!isNaN(contentLength)) {
//         resolve(contentLength);
//       } else {
//         reject(new Error(`Failed to get content length of the image`));
//       }
//     });
//   });
// }
