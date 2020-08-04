import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useDispatch } from 'react-redux';

import Fallback from '~/assets/images/fallback-square.png';
import HeaderBackButton from '~/components/HeaderBackButton';
import Loading from '~/components/Loading';
import TrackItem from '~/components/TrackItem';
import api from '~/services/api';
import { Creators as PlayerActions } from '~/store/ducks/player';

import {
  ParentContainer,
  Container,
  Details,
  Image,
  DetailsTitle,
  Buttons,
  Button,
  List,
  TextButton,
} from './styles';

function Album({ navigation, route }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  navigation.setOptions({
    title: 'Album',
    headerTitleStyle: {
      flex: 1,
      textAlign: 'center',
      color: '#FFF',
      textTransform: 'uppercase',
    },
    headerLeft: () => <HeaderBackButton onPress={() => navigation.goBack()} />,
    headerRight: () => <View />,
  });

  const albumId = route.params.id;
  const [state, setState] = useState({
    error: false,
    loading: true,
    data: {
      name: '',
      tracks: 0,
      picture: '',
    },
    tracks: {
      error: false,
      loading: true,
      data: [],
      total: 0,
      page: 1,
    },
  });

  useEffect(() => {
    async function fetchAlbum() {
      try {
        const [album, tracks] = await Promise.all([
          api.get(`/albums/${albumId}`),
          api.get(`/albums/${albumId}/tracks`, {
            params: {
              page: state.tracks.page,
            },
          }),
        ]);

        setState({
          ...state,
          error: false,
          loading: false,
          data: album.data.album,
          tracks: {
            error: false,
            loading: false,
            data: tracks.data.tracks,
            total: tracks.data.meta.total,
            page: tracks.data.meta.page + 1,
          },
        });
      } catch (err) {
        setState({ ...state, error: true, loading: false });
      }
    }
    fetchAlbum();
  }, []);

  async function fetchTracks() {
    try {
      setState({ ...state, tracks: { ...state.tracks, loading: true } });
      const response = await api.get(`/albums/${albumId}/tracks`, {
        params: {
          page: state.tracks.page,
        },
      });

      setState({
        ...state,
        tracks: {
          error: false,
          loading: false,
          data: [...state.tracks.data, ...response.data.tracks],
          total: response.data.meta.total,
          page: response.data.meta.page + 1,
        },
      });
    } catch (err) {
      setState({
        ...state,
        tracks: { ...state.tracks, error: true, loading: false },
      });
    }
  }

  function endReached() {
    if (
      state.tracks.total > state.tracks.data.length &&
      !state.tracks.loading
    ) {
      fetchTracks();
    }
  }

  function handlePlaylistPlay() {
    dispatch(PlayerActions.fetchPlaylist(albumId, 'albums'));
  }

  return (
    <ParentContainer>
      {state.loading && <Loading />}
      {!state.loading && (
        <Container>
          <List
            ListHeaderComponent={
              <>
                <Details>
                  <Image
                    source={{ uri: state.data.picture }}
                    fallback={Fallback}
                  />
                  <DetailsTitle>{state.data.name}</DetailsTitle>
                  <Buttons>
                    <Button onPress={handlePlaylistPlay}>
                      <TextButton>{t('commons.play_tracks_button')}</TextButton>
                    </Button>
                  </Buttons>
                </Details>
              </>
            }
            data={state.tracks.data}
            keyExtractor={item => `key-${item.id}`}
            renderItem={({ item }) => <TrackItem data={item} margin />}
            onEndReached={endReached}
            onEndReachedThreshold={0.4}
            ListFooterComponent={state.tracks.loading && <Loading size={24} />}
            ListFooterComponentStyle={{
              marginTop: 10,
            }}
          />
        </Container>
      )}
    </ParentContainer>
  );
}

export default Album;
