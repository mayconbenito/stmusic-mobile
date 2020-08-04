import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useDispatch } from 'react-redux';
import * as Yup from 'yup';

import HeaderBackButton from '~/components/HeaderBackButton';
import Loading from '~/components/Loading';
import api from '~/services/api';
import { Creators as SessionActions } from '~/store/ducks/session';

import {
  Container,
  Form,
  InputGroup,
  Input,
  InputError,
  FormMessage,
  Button,
  TextButton,
} from './styles';

function Login({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  navigation.setOptions({
    headerStyle: {
      backgroundColor: '#141414',
      shadowRadius: 0,
      shadowOffset: {
        height: 0,
      },
      shadowColor: 'transparent',
      elevation: 0,
    },
    headerLeft: () => <HeaderBackButton onPress={() => navigation.goBack()} />,
    title: t('login.title'),
    headerTitleStyle: {
      flex: 1,
      textAlign: 'center',
      color: '#FFF',
      textTransform: 'uppercase',
    },
    headerRight: () => <View />,
  });

  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [errors, setErrors] = useState();
  const [message, setMessage] = useState();
  const [loading, setLoading] = useState();

  const inputPasswordRef = useRef();

  function handleEmailChange(text) {
    setEmail(text);
  }

  function handlePasswordChange(text) {
    setPassword(text);
  }

  async function handleLogin() {
    try {
      setLoading(true);
      const response = await api.post('/sessions', {
        email,
        password,
      });

      if (response.status === 200) {
        setLoading(false);
        dispatch(
          SessionActions.createSession({
            jwt: response.data.jwt,
            user: response.data.user,
          })
        );
      }
    } catch (err) {
      setLoading(false);
      if (err.response.status === 401) {
        setMessage(t('login.email_or_password_invalid'));
      }
    }
  }

  async function handleSubmit() {
    try {
      const schema = Yup.object().shape({
        email: Yup.string()
          .email(t('login.invalid_email_format'))
          .required(t('login.email_is_required')),
        password: Yup.string()
          .min(6, t('login.password_length'))
          .required(t('login.password_is_required')),
      });

      const validation = await schema.validate(
        { email, password },
        { abortEarly: false }
      );

      if (validation) {
        setErrors();
        handleLogin();
      }
    } catch (err) {
      const validationErrors = {};
      err.inner.forEach(error => {
        validationErrors[error.path] = error.message;
      });

      setErrors(validationErrors);
    }
  }

  return (
    <Container>
      <Form>
        <InputGroup>
          <Input
            value={email}
            onChangeText={handleEmailChange}
            placeholder={t('login.email_input')}
            returnKeyType="next"
            keyboardType="email-address"
            autoCompleteType="email"
            onSubmitEditing={() => inputPasswordRef.current.focus()}
          />
          {errors && errors.email && <InputError>{errors.email}</InputError>}
        </InputGroup>

        <InputGroup>
          <Input
            ref={inputPasswordRef}
            value={password}
            onChangeText={handlePasswordChange}
            placeholder={t('login.password_input')}
            returnKeyType="done"
            secureTextEntry
            onSubmitEditing={handleSubmit}
          />
          {errors && errors.password && (
            <InputError>{errors.password}</InputError>
          )}
        </InputGroup>

        <Button onPress={handleSubmit}>
          {!loading ? (
            <TextButton>{t('login.sign_in')}</TextButton>
          ) : (
            <Loading animating size={24} color="#000" />
          )}
        </Button>

        {message && <FormMessage>{message}</FormMessage>}
      </Form>
    </Container>
  );
}

export default Login;
