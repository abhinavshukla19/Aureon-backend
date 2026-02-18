export function getRandomArbitrary(min:number, max:number) {
  return Math.random() * (max - min) + min;
}

export const generaterandomotp = () => {
  return Math.floor(getRandomArbitrary(100000, 999999));
}