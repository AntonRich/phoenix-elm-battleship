import React, {PropTypes} from 'react';
import classnames         from 'classnames';
import Constants          from '../../constants';
import { setGame }        from '../../actions/game';

export default class Board extends React.Component {
  _renderRows(data) {
    const { grid } = data;

    let rows = [this._buildRowHeader()];

    for (var y = 0; y < 10; y++) {
      let cells = [<div key={`header-${y}`} className="header cell">{y + 1}</div>];

      for (var x = 0; x < 10; x++) {
        cells.push(this._renderCell(y, x, grid[`${y}${x}`]));
      }

      rows.push(<div className="row" key={y}>{cells}</div>);
    }

    return rows;
  }

  _renderCell(y, x, value) {
    const { selectedShip, gameChannel, dispatch } = this.props;
    const key = `${y}${x}`;

    const onClick = (e) => {
      console.log(key);
      if (selectedShip.name === null) return false;
      if (value != Constants.GRID_VALUE_WATTER) return false;

      const ship = {
        x: x,
        y: y,
        size: selectedShip.size,
        orientation: selectedShip.orientation,
      };

      gameChannel.push('game:place_ship', { ship: ship })
      .receive('ok', (payload) => {
        dispatch(setGame(payload.game));
      })
      .receive('error', (payload) => console.log(payload));
    };

    const classes = classnames({
      cell: true,
      ship: value === Constants.GRID_VALUE_SHIP,
    });

    return (
      <div
        className={classes}
        key={key}
        onClick={onClick}></div>
    );
  }

  _buildRowHeader() {
    let values = [<div key="empty" className="header cell"></div>];

    for (var i = 0; i < 10; ++i) {
      values.push(<div key={i} className="header cell">{String.fromCharCode(i + 65)}</div>);
    }

    return (
      <div key="col-headers" className="row">
        {values}
      </div>
    );
  }

  render() {
    const { data, selectedShip } = this.props;

    if (!data) return false;

    const classes = classnames({
      grid: true,
      pointer: selectedShip.name != null,
    });

    return (
      <div className={classes}>
        {::this._renderRows(data)}
      </div>
    );
  }
}
