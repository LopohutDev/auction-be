export const PasswordRegex =
  /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
export const EmailRegex =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
export const ItemTag = /^[a-zA-Z@~`!@#$%^&*()_=+\\';:"\/?>.<,-]*$/;
export const ItemName = /^[a-zA-Z ]*$/;
