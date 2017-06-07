import React from 'react';
import { connect } from 'react-redux';
import { newGame } from '../actions';

let Face = ({dispatch, difficulty, status}) => {
  const icon = status === 'winner'   ? 'fa fa-thumbs-o-up' :
               status === 'gameover' ? 'fa fa-frown-o'     :
                                       'fa fa-smile-o';

  const onResetGame = () => {
    dispatch(newGame(difficulty));
  };

  return (
    <div className="face" onClick={onResetGame}>
      <i className={icon} />
    </div>
  );
};

Face = connect()(Face);
export default Face;
