// IP de tu servidor de desarrollo - CAMBIAR ESTO A TU IP REAL

export const getExpoSocketConfig = () => {
  return {
    url: `http://${SERVER_IP}:${SERVER_PORT}`,
    options: {
      transports: ['websocket'], // Solo usar websocket en Expo
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      path: '/socket.io',
    },
  };
};

export const getExpoServerUrl = () => getExpoSocketConfig().url;
