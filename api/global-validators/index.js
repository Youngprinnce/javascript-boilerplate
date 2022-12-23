const {DO_SPACES_CDN} = process.env
const {resources} = require("../auth-resources");
const {check, param, body} = require("express-validator");
const mimeTypes = ['image/jpeg', 'image/jpg', 'image/png']

const passwordValidator = [
  check('password').matches(/^(?=.{8,}$)(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/)
    .withMessage('Password must contain 8 characters and at least 1 number, 1 uppercase, and 1 lowercase letter.'),
  check('confirmPassword').custom((confirmPassword, {req}) => {
    const {password} = req.body
    if (password !== confirmPassword) throw new Error('passwords must be same');
    return confirmPassword;
  })
];

const noFloatValue = ({field}) => check(field).isNumeric().withMessage(`enter a valid ${field}`).isInt()
  .withMessage('only whole numbers are allowed, no decimals and/or fractions');

const username = [
  check('username').trim().isLength({min: 1}).withMessage('Username cannot be empty.')
    .custom(value => {
      const isUsernameValid = /^(?=.{4,20}$)(?:[a-zA-Z\d]+(?:[._][a-zA-Z\d])*)+$/.test(`${value}`);
      if (!isUsernameValid)
        throw new Error(`username can only be alphanumerical, min and max of 4 to 20 characters, optional '_' and/or '.'`);
      return value;
    })
];

const privileges = check('privileges', 'privileges field cannot be empty').custom(value => {
  const undefinedValues = ['undefined', undefined];
  const privilegesFields = Object.values(resources);
  const clientPrivilegesFields = Object.keys(value);

  if (typeof value !== 'object') throw new Error(`type of 'privileges' must be an object{}`);

  for (const privilegesField of privilegesFields) {
    const read = value[privilegesField]?.read, write = value[privilegesField]?.write;
    if (!clientPrivilegesFields.includes(privilegesField))
      throw new Error(`privileges field must include all of these values: {${privilegesFields}}`);
    if (undefinedValues.includes(read) || undefinedValues.includes(write))
      throw new Error(`the values of each privileges field cannot be 'undefined'`);
    if (typeof JSON.parse(read) !== 'boolean' || typeof JSON.parse(write) !== 'boolean')
      throw new Error(`the values of each privileges field for write or read must be true or false`);
  }

  return value;
});

const emailValidator = check('email', 'Email is required.').normalizeEmail(
  {
    all_lowercase: true, gmail_lowercase: true,
    yahoo_remove_subaddress: false, icloud_lowercase: true, icloud_remove_subaddress: false,
    outlookdotcom_lowercase: true, outlookdotcom_remove_subaddress: false, yahoo_lowercase: true,
    gmail_remove_dots: false, gmail_remove_subaddress: false, gmail_convert_googlemaildotcom: false,
  }
).isEmail().withMessage('Must be valid email.').matches(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i).withMessage('Must be valid email.');

const userBalanceAlteration = [
  check('amount').isNumeric().withMessage('please enter a valid amount'),
  check('deduction').optional({nullable: true, checkFalsy: true}).isBoolean()
    .withMessage('approved must either be true or false value')
];

const startDateEndDate = ({canDatesBeEmpty = false}) => [
  body('startDate')
    .custom((value, {req}) => {
      let {endDate, startDate} = req.body;

      if ((!endDate || !startDate) && !canDatesBeEmpty) throw new Error('end date and/or start date cannot be empty');
      if (endDate && !startDate) throw new Error(`you can't provide an end date without a start date`);
      if (endDate && new Date(endDate).toISOString() < new Date(startDate).toISOString()) throw new Error('end date cannot be earlier than start date');
      if ((endDate && isNaN(new Date(endDate).getFullYear())) || (startDate && isNaN(new Date(startDate).getFullYear())))
        throw new Error(`you have entered an incorrect date and/or date format`);

      return value || canDatesBeEmpty;
    })
];

const isMongoObjectId = ({id}) => [
  param(`${id}`)
    .isMongoId()
    .withMessage(`provided ${id} is not a correct id`)
];

const walletValidator = check('wallet').not().isEmpty().withMessage('Please provide the wallet.')
  .custom(async (wallet) => {
    wallet = wallet.trim().toLowerCase();
    const types = ['ngn', 'usd', 'ghs'];
    if (!types.includes(wallet)) throw new Error(`Wallet should be one of these: ${types}`);
    return wallet;
  });

const files = ({fileName}) => check(`${fileName}`).optional({nullable: true, checkFalsy: true})
  .custom(values => {
    if (!Array.isArray(values)) throw new Error(`expected the value of '${fileName}' to be an array of objects`);
    if (values.length > 30) throw new Error(`you're allowed maximum of 30 file uploads`);

    for (const value of values) {
      if (value && !value?.includes(DO_SPACES_CDN)) throw new Error('tradeFiles does not contain valid url');
    }

    return values;
  });

module.exports = {
  files,
  pinCode,
  username,
  privileges,
  noFloatValue,
  emailValidator,
  walletValidator,
  amountValidator,
  isMongoObjectId,
  startDateEndDate,
  passwordValidator,
}
