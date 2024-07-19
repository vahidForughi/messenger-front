import Axios from 'axios';
import config from '../config/api';

const service = Axios.create({
  baseURL: config.apiUrl,
  headers: config.headers
});

service.interceptors.request.use((request) => {
  if (config)
    request.headers.Authorization = config.authorization;

  return request;
});

service.interceptors.response.use(response => response, (error) => {
  console.log('http error', error);
  return Promise.reject(error.status ? error : error.response);
});

function access(url: string, param: [], method: string) {
  param = param || {};
  let ret = null;
  const upperMethod = method.toUpperCase();

  /* eslint-disable no-underscore-dangle */
  const __randNum = Math.random();

  if (upperMethod === 'POST') {
    ret = service.post(url, param, { params: { __randNum } });
  } else if (upperMethod === 'PUT') {
    ret = service.put(url, param, { params: { __randNum } });
  } else if (upperMethod === 'DELETE') {
    ret = service.delete(url, { params: { ...param, __randNum } });
  } else {
    ret = service.get(url, { params: { ...param, __randNum } });
  }
  return ret.then((res) => {
    if (res.data) {
      if (upperMethod === 'POST') {
        console.log('Saved Successfully.')
      }
      else if(upperMethod === 'PUT'){
        console.log('Saved Successfully.')
      }
      else if(upperMethod === 'DELETE'){
        console.log('Deleted Successfully.')
      }

      return res.data.data;
    }

    return Promise.reject(res);
  }, (res) => {
    let errMsg = '';
    console.log('res',res)
    if (res.status === 0) {
      errMsg = 'Connection lost!';
    }
    else if (res.status === 401) {
      errMsg = 'The input data is incomplement.';
      Object.entries(res.data.errors).forEach(entry => {
        const [key, value] = entry;
        errMsg += '\n'+'<br/>' + key + ': ' + value
      });
    }
    else if (res.status === 403) {
      Object.entries(res.data.errors).forEach(entry => {
        const [key, value] = entry;
        errMsg += '\n'+'<br/>' + value
      });
    }
    else if (res.status === 404) {
      errMsg = 'Page not found.';
    }
    else if (res.status === 500) {
      errMsg = 'There is a problem. Contact support.';
    }
    if (errMsg) {
      console.error(errMsg)
    }

    return Promise.reject(res);
  })
    .finally(() => {});
}

export default {
  service,
  get(url: string, param: [] = []) {
    return access(url, param, 'get');
  },
  delete(url: string, param: [] = []) {
    return access(url, param, 'delete');
  },
  post(url: string, param: [] = []) {
    return access(url, param, 'post');
  },
  put(url: string, param: [] = []) {
    return access(url, param, 'put');
  },
};
