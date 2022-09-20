export const getStartOfDay = (time) => {
  const ts = new Date(time);
  return new Date(ts.getFullYear(), ts.getMonth(), ts.getDate()).getTime();
};
