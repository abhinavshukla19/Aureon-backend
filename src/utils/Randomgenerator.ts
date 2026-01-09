export function getRandomArbitrary(min:number, max:number) {
  return Math.random() * (max - min) + min;
}


export const generaterandomotp=()=>{
    return getRandomArbitrary(1000, 9999)
}