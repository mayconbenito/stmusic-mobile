import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { useQuery } from 'react-query';
import { useDispatch } from 'react-redux';

import BigAlbumItem from '~/components/BigAlbumItem';
import BigPlaylistItem from '~/components/BigPlaylistItem';
import BigTrackItem from '~/components/BigTrackItem';
import HeaderIcon from '~/components/HeaderIcon';
import Loading from '~/components/Loading';
import { isLoggedIn } from '~/helpers/isLoggedIn';
import api from '~/services/api';
import { Creators as PlayerActions } from '~/store/ducks/player';

import HomeArtistItem from './HomeArtistItem';
import {
  Container,
  ScrollerContainer,
  ScrollerHeader,
  ScrollerHeaderButton,
  ScrollerHeaderButtonIcon,
  ScrollerTitleText,
  List,
} from './styles';

function Home({ navigation }) {
  const { t } = useTranslation();

  const dispatch = useDispatch();

  navigation.setOptions({
    headerStyle: {
      backgroundColor: '#000',
    },
    headerTitle: () => <HeaderIcon />,
  });

  let recentlyPlayedQuery;

  if (isLoggedIn()) {
    recentlyPlayedQuery = useQuery(
      isLoggedIn() ? 'recentlyPlayed' : null,
      async () => {
        const response = await api.get(
          '/app/me/recently-played?page=1&limit=30'
        );

        return response.data;
      }
    );
  }

  const trendingQuery = useQuery('trending', async () => {
    const response = await api.get(
      '/app/browse/tracks/trending?page=1&limit=30'
    );

    return response.data;
  });

  const mostPlayedTracksQuery = useQuery('mostPlayedTracks', async () => {
    const response = await api.get(
      '/app/browse/tracks/most-played?page=1&limit=30'
    );

    return response.data;
  });

  const mostFollowedArtistsQuery = useQuery('mostFollowedArtists', async () => {
    const response = await api.get(
      '/app/browse/artists/most-followed?page=1&limit=30'
    );

    return response.data;
  });

  function handleQueuePlay({ name, tracks, nameKey }) {
    dispatch(
      PlayerActions.loadQueue(null, {
        id: nameKey,
        name,
        tracks,
      })
    );
  }

  function handleQueueTrackPlay(track, nameKey) {
    dispatch(PlayerActions.play(track, nameKey));
  }

  function isLoading() {
    if (!recentlyPlayedQuery?.isLoading) {
      return false;
    }

    if (!trendingQuery.isLoading) {
      return false;
    }

    if (!mostPlayedTracksQuery.isLoading) {
      return false;
    }

    if (!mostFollowedArtistsQuery.isLoading) {
      return false;
    }

    return true;
  }

  return (
    <Container>
      {isLoading() && <Loading />}

      {!isLoading() && (
        <ScrollView>
          {recentlyPlayedQuery.data?.lists?.length > 0 && (
            <ScrollerContainer>
              <ScrollerHeader>
                <ScrollerTitleText>
                  {t('home.recently_played')}
                </ScrollerTitleText>
              </ScrollerHeader>
              <List
                data={recentlyPlayedQuery.data?.lists}
                keyExtractor={item => `${item.listType}-${item.id}`}
                renderItem={({ item }) => {
                  if (item.listType === 'artist') {
                    return (
                      <HomeArtistItem
                        data={{ name: item.name, picture: item.picture }}
                        onPress={() =>
                          navigation.navigate('Artist', { id: item.id })
                        }
                      />
                    );
                  }

                  if (item.listType === 'album') {
                    return (
                      <BigAlbumItem
                        data={{
                          name: item.name,
                          picture: item.picture,
                          artists: item.artists,
                          type: item.albumType,
                        }}
                        medium
                        onPress={() =>
                          navigation.navigate('Album', { id: item.id })
                        }
                      />
                    );
                  }

                  if (item.listType === 'playlist') {
                    return (
                      <BigPlaylistItem
                        data={{
                          name: item.name,
                          picture: item.picture,
                        }}
                        medium
                        onPress={() =>
                          navigation.navigate('Playlist', { id: item.id })
                        }
                      />
                    );
                  }

                  <BigTrackItem
                    data={item}
                    onPress={() =>
                      handleQueueTrackPlay(item, 'recently_played')
                    }
                  />;
                }}
                horizontal
              />
            </ScrollerContainer>
          )}

          {trendingQuery.data?.tracks?.length > 0 && (
            <ScrollerContainer>
              <ScrollerHeader>
                <ScrollerTitleText>{t('home.trending')}</ScrollerTitleText>
                <ScrollerHeaderButton
                  onPress={() => {
                    handleQueuePlay({
                      name: t('home.trending'),
                      tracks: trendingQuery?.data?.tracks,
                      nameKey: 'trending',
                    });
                  }}
                >
                  <ScrollerHeaderButtonIcon />
                </ScrollerHeaderButton>
              </ScrollerHeader>

              <List
                data={trendingQuery.data?.tracks}
                keyExtractor={item => `key-${item.id}`}
                renderItem={({ item }) => (
                  <BigTrackItem
                    data={item}
                    onClick={() => handleQueueTrackPlay(item, 'trending')}
                  />
                )}
                horizontal
              />
            </ScrollerContainer>
          )}

          {mostPlayedTracksQuery.data?.tracks?.length > 0 && (
            <ScrollerContainer>
              <ScrollerHeader>
                <ScrollerTitleText>
                  {t('home.most_played_tracks')}
                </ScrollerTitleText>
                <ScrollerHeaderButton
                  onPress={() => {
                    handleQueuePlay({
                      name: t('home.most_played_tracks'),
                      tracks: mostPlayedTracksQuery?.data?.tracks,
                      nameKey: 'most_played_tracks',
                    });
                  }}
                >
                  <ScrollerHeaderButtonIcon />
                </ScrollerHeaderButton>
              </ScrollerHeader>
              <List
                data={mostPlayedTracksQuery.data?.tracks}
                keyExtractor={item => `key-${item.id}`}
                renderItem={({ item }) => (
                  <BigTrackItem
                    data={item}
                    onPress={() =>
                      handleQueueTrackPlay(item, 'most_played_tracks')
                    }
                  />
                )}
                horizontal
              />
            </ScrollerContainer>
          )}

          {mostFollowedArtistsQuery.data?.artists?.length > 0 && (
            <ScrollerContainer style={{ marginBottom: 0 }}>
              <ScrollerTitleText>
                {t('home.most_followed_artists')}
              </ScrollerTitleText>

              <List
                data={mostFollowedArtistsQuery.data?.artists}
                keyExtractor={item => `key-${item.id}`}
                renderItem={({ item }) => (
                  <HomeArtistItem
                    data={item}
                    onPress={() =>
                      navigation.navigate('Artist', { id: item.id })
                    }
                  />
                )}
                horizontal
              />
            </ScrollerContainer>
          )}
        </ScrollView>
      )}
    </Container>
  );
}

export default Home;
