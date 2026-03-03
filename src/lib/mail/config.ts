export type MailConfig = {
  imap: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
};
