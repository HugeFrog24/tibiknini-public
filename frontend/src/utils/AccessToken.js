export const SetAccessToken = (token) => {
  localStorage.setItem("access_token", token);
};

export const SetRefreshToken = (token) => {
  localStorage.setItem("refresh_token", token);
};

export const GetAccessToken = () => {
  return localStorage.getItem("access_token");
};

export const GetRefreshToken = () => {
  return localStorage.getItem("refresh_token");
};

export const RemoveTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  window.location.reload();
};