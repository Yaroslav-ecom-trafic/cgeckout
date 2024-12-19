import {
  reactExtension,
  Banner,
  useApplyAttributeChange,
  useInstructions,
  useTranslate,
  PhoneField,
  TextField,
  useBuyerJourneyIntercept,
  Form,
  Grid,
  GridItem,
  View,
  Button,
  BlockSpacer,
  useAttributes,
  Text,
  BlockStack
} from "@shopify/ui-extensions-react/checkout";
import { useState, useEffect } from "react";

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [clientData, setClientData] = useState(null);
  const { attributes } = useAttributes();
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const translate = useTranslate();
  const instructions = useInstructions();
  const applyAttributeChange = useApplyAttributeChange();

  const addAttributes = async (data) => {
    console.log('data editing', data);
    try {
      await applyAttributeChange({
        type: 'updateAttribute',
        key: 'customer_first_name',
        value: data.firstName
      });

      await applyAttributeChange({
        type: 'updateAttribute',
        key: 'customer_last_name',
        value: data.lastName
      });

      await applyAttributeChange({
        type: 'updateAttribute',
        key: 'customer_phone',
        value: data.phone
      });

      console.log('Attributes updated successfully');
    } catch (error) {
      console.error('Failed to update attributes:', error);
    }
  };

  const intercept = useBuyerJourneyIntercept(
    ({ canBlockProgress }) => {
      console.log('Intercept check:', { canBlockProgress, clientData });

      if (!canBlockProgress) {
        return { behavior: 'allow' };
      }

      setAttemptedSubmit(true);

      if (clientData === null) {
        return {
          behavior: 'block',
          errors: [
            {
              message: 'Пожалуйста, заполните все необходимые данные'
            }
          ]
        };
      }

      console.log('intercept clientData', clientData);

      return { behavior: 'allow' };
    }
  );

  if (!instructions.attributes.canUpdateAttributes) {
    return (
      <Banner title="checkout-ui" status="warning">
        {translate("attributeChangesAreNotSupported")}
      </Banner>
    );
  }

  function validateText(text) {
    const textOnlyRegex = /^[A-Za-zА-Яа-яЁё]+$/;
    const isValid = textOnlyRegex.test(text);

    return {
      isValid: isValid,
      error: isValid ? null : 'В поле Имя и Фамилия доступны только буквы'
    };
  }

  function validatePhone(phone) {
    const hasLetters = /[A-Za-zА-Яа-яЁё]/.test(phone);
    
    if (hasLetters) {
      return {
        isValid: false,
        error: 'Номер телефона не должен содержать букв'
      };
    }

    const phoneRegex = /^\+\d{12,}$/;
    const cleanPhone = phone.replace(/[\s\-]/g, '');
    const isValid = phoneRegex.test(cleanPhone);

    return {
      isValid: isValid,
      error: isValid ? null : 'Номер должен начинаться с + и содержать минимум 12 цифр'
    };
  }

  const handleSubmit = () => {
    const firstNameIsValid = validateText(firstName);
    const lastNameIsValid = validateText(lastName);
    const phoneIsValid = validatePhone(phone);

    const validationArr = [firstNameIsValid, lastNameIsValid, phoneIsValid];
    const errorMessage = validationArr.find(item => !item.isValid);
    const isValid = validationArr.every(item => item.isValid);

    if (!isValid) {
      console.log("errorMessage", errorMessage);
      return;
    }

    setClientData({
      firstName,
      lastName,
      phone
    });
  };

  useEffect(() => {
    if (clientData) {
      addAttributes(clientData);
    }
  }, [clientData]);

  const shouldShowError = (value, validationFn) => {
    return (attemptedSubmit || value) && !validationFn(value).isValid;
  };

  return (
    <BlockStack spacing="base">
      {attributes && attributes.length > 0 && (
        <BlockStack spacing="tight">
          <Text>Current Attributes:</Text>
            {attributes.map((attr) => (
              <Text key={attr.key}>
                {attr.key}: {attr.value}
              </Text>
            ))}
        </BlockStack>
      )}
      <Form onSubmit={handleSubmit}>
        <Grid columns={['50%', '50%']} spacing="base">
          <View>
            <TextField
              label="First name"
              value={firstName}
              onChange={setFirstName}
              error={shouldShowError(firstName, validateText) ? validateText(firstName).error : null}
              required={true}
            />
          </View>
          <View>
            <TextField
              label="Last name"
              value={lastName}
              onChange={setLastName}
              error={shouldShowError(lastName, validateText) ? validateText(lastName).error : null}
              required={true}
            />
          </View>
          <GridItem columnSpan={2}>
            <PhoneField
              label="Phone"
              value={phone}
              onChange={setPhone}
              error={shouldShowError(phone, validatePhone) ? validatePhone(phone).error : null}
              required={true}
            />
          </GridItem>
        </Grid>
        <BlockSpacer spacing="base" />
        <Button accessibilityRole="submit">
          Submit
        </Button>
      </Form>
    </BlockStack>
  );
}