const removeAtIndex = (arr: any[], index: number) => {
  const copy = [...arr];
  copy.splice(index, 1);
  return copy;
};

const toggle = (arr: any, item: any, getValue = (item: any) => item) => {
  const index = arr.findIndex( (i: number) => getValue(i) === getValue(item));
  if (index === -1) return [...arr, item];
  return removeAtIndex(arr, index);
};

export const copyArrayOfObjects = (arr: Object[]): Object[] => {
  const clonedArray: Object[] = []; 
  arr.forEach(val => clonedArray.push(Object.assign({}, val)))
  return clonedArray
} 

export { toggle };
