
enum UserActiveStatus {
  InActive = 1,
  Active = 2,
}

enum MessageStatus {
  Sending = 1,
  UnSeened = 2,
  Seened = 3,
  Failed = 4,
}

enum UploadStatus {
  Empty = 1,
  Preparing = 2,
  Uploading = 3,
  Uploaded = 4,
  Failed = 5,
}

export {
  UserActiveStatus,
  MessageStatus,
  UploadStatus,
}
