export function randomHash (len: number) {
  const options = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";
  for (let i = 0; i < len; i++) { 
    text += options[(Math.floor(Math.random() * options.length))];
  }
  return text;
}

