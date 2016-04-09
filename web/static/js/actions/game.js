import { push }   from 'react-router-redux';
import Constants  from '../constants';

export function joinGame(socket, player, gameId) {
  return dispatch => {
    const channel = socket.channel(`game:${gameId}`);

    channel.join()
    .receive('ok', () => {
      channel.push('game:get_data', { game_id: gameId, player_id: player.id })
      .receive('ok', (payload) => {
        dispatch(setChannelAndGame(channel, payload.game));
      });

      channel.push('game:joined');
    })
    .receive('error', (payload) => {
      if (payload.reason === 'No more players allowed') dispatch(push('/'));
      if (payload.reason === 'Game does not exist') dispatch(push('/'));
    });

    channel.on('game:message_sent', (payload) => {
      dispatch({
        type: Constants.GAME_ADD_MESSAGE,
        message: payload.message,
      });
    });

    channel.on('game:player_joined', (payload) => {
      dispatch({
        type: Constants.GAME_PLAYER_JOINED,
        player: payload.player,
        board: payload.board,
      });
    });

    channel.on(`game:player:${player.id}:opponents_board_changed`, (payload) => {
      dispatch({
        type: Constants.GAME_OPPONENTS_BOARD_UPDATE,
        board: payload.board,
      });
    });
  };
}

export function setChannelAndGame(channel, game) {
  return dispatch => {
    dispatch({
      type: Constants.GAME_SET_CHANNEL,
      channel: channel,
    });

    dispatch(setGame(game));
  };
}

export function setGame(game) {
  return {
    type: Constants.GAME_SET_GAME,
    game: game,
  };
}

export function selectShip(ship) {
  return {
    type: Constants.GAME_SETUP_SELECT_SHIP,
    ship: ship,
  };
}
