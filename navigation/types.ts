export type AppRoutes = {
  '/': undefined;
  '/EntryCodeScreen': undefined;
  '/WaitingRoomScreen': { gameCode?: string };
  '/ControllerScreen': undefined;
  '/MenuScreen': undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends AppRoutes {}
  }
}
