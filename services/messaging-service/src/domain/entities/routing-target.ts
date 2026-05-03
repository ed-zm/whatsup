export interface OnlineConnectionTarget {
  userId: string;
  nodeId: string;
  connectionId: string;
}

export interface RoutedRecipient {
  userId: string;
  deliveredOnline: boolean;
  targets: OnlineConnectionTarget[];
}
