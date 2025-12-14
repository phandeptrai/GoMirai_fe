// Lightweight stub for the template AI helper.
export const suggestDestination = async (query) => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    placeName: 'Quán cafe yên tĩnh',
    address: '12 Nguyễn Huệ, Q.1',
    reason: `Gợi ý cho: "${query}"`,
  };
};
