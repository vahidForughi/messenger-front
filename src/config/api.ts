
// const url = window.location;
// var baseUrl = getUrl .protocol + "//" + getUrl.host + "/" + getUrl.pathname.split('/')[1];
// const baseUrl = url.origin;
const baseUrl = 'http://localhost:8000';

const apiUrl = baseUrl + '/api/v1';

const headers = {
  'content-type': 'application/json;charset=utf-8'
};
const token = localStorage.auth_token;
const authorization = `Bearer ${token}`;


export default {
  baseUrl,
  apiUrl,
  headers,
  token,
  authorization
};
