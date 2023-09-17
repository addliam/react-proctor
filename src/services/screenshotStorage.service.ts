import axios from "axios";
const SCREENSHOT_STORAGE_API = `${
  import.meta.env.VITE_BACKEND_SCREENSHOT_STORAGE_API
}`;

const postBase64Data = async (
  base64data: string,
  userTestId: string,
  tipo: "rostro" | "pantalla"
) => {
  // es requisito que userTestId este definido
  if (!userTestId) {
    console.log(`[-] ERROR: userTestId no esta definido!`);
    return;
  }
  switch (tipo) {
    case "rostro":
      var URL = `${SCREENSHOT_STORAGE_API}/screenshots/b64/${userTestId}?type=rostro`;
      console.log({ URL });
      var data = {
        b64image: base64data,
      };
      axios
        .post(URL, data)
        .then((res) => console.log(res.data))
        .catch((err) => console.error(err));

      break;
    case "pantalla":
      var URL = `${SCREENSHOT_STORAGE_API}/screenshots/b64/${userTestId}`;
      console.log({ URL });
      var data = {
        b64image: base64data,
      };
      axios
        .post(URL, data)
        .then((res) => console.log(res.data))
        .catch((err) => console.error(err));

      break;

    default:
      break;
  }
};

export const screenshotStorageService = { postBase64Data };
