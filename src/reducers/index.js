import {List, Map, Repeat} from 'immutable';

const initialState = Map({
  difficulty: 0,
  cells: List(),
  stats: Map()
});

export const gameState = (state = initialState, action) => {
  switch(action.type) {
    case 'NEW_GAME':
      state = newGame(initialState, action);
      break;
    case 'RESET_GAME':
      state = resetGame(state);
      break;
    case 'OPEN_CELL':
      state = openCell(state, action);
      break;
    case 'OPEN_EMPTY':
      state = openEmpty(state, action);
      break;
    case 'OPEN_MINE':
      state = openMine(state);
      break;
    case 'FLAG_CELL':
      state = flagCell(state, action);
      break;
    default:
      return state;
  }

  let cells  = state.get('cells'),
      stats  = getStats(cells),
      status = getStatus(stats);

  return state.merge(Map({stats, status}));
};

const newGame = (state, action) => {
  let {difficulty}        = action,
      {rows, cols, mines} = getDifficulty(difficulty),
      cells               = createCells(rows, cols, mines);

  return state.merge({ difficulty, rows, cols, mines, cells });
};

const resetGame = (state) => {
  let rows  = state.get('rows'),
      cols  = state.get('cols'),
      mines = state.get('mines');

  return state.set('cells', createCells(rows, cols, mines));
};

const flagCell = (state, {id}) =>
  state.updateIn(['cells', id, 'status'], s => 
    s === 'flag' ? 'closed' : 'flag' );

const openCell = (state, {id}) =>
  state.setIn(['cells', id, 'status'], 'open');

const openEmpty = (state, {id}) => {
  const cascade = (cells, id) => {
    let x = cells.getIn([id, 'x']),
        y = cells.getIn([id, 'y']);

    return cells
      .setIn([id, 'status'], 'open')
      .update(cs => cs.getIn([id, 'value']) === 0
        ? cs.filter(c => c.get('x') >= x-1 && c.get('x') <= x+1
                      && c.get('y') >= y-1 && c.get('y') <= y+1
                      && c.get('status') !== 'open')
            .reduce((m,c) => cascade(m, c.get('id')), cs)
        : cs);
  };

  return state.update('cells', cells => cascade(cells, id));
};

const openMine = (state) =>
  state.update('cells', cs => 
    cs.map(c => c.get('value') === '*' 
      ? c.set('status', 'open') 
      : c));

const getStatus = (stats) => {
  if (stats.get('unopened') === 0)
    return 'winner';
  if (stats.get('detonated') > 0)
    return 'loser';
  if (stats.get('played') > 0)
    return 'playing';

  return 'new';
};

const getStats = (cells) => {
  return cells.reduce((stats, cell) => {
    if (cell.get('value') === '*')
      stats = stats.update('unflagged', v => v + 1);

    if (cell.get('status') === 'flag')
      stats = stats.update('unflagged', v => v - 1);

    if (cell.get('status') === 'open' && cell.get('value') === '*') 
      stats = stats.update('detonated', v => v + 1);

    if (cell.get('status') === 'closed' && cell.get('value') !== '*')
      stats = stats.update('unopened', v => v + 1);

    if (cell.get('status') !== 'closed')
      stats = stats.update('played', v => v + 1);

    return stats;
  }, Map({detonated: 0, played: 0, unflagged: 0, unopened: 0}));
};

const createCells = (rows, cols, mines) =>
  List(Repeat(0, rows*cols))                      
    .merge(Repeat('*', mines)).sortBy(Math.random)
    .map((v,i) => Map({x: i/cols|0, y: i%cols, id: i, value: v, status: 'closed'}))
    .update(cells => cells.reduce((m,c,i) =>
      m.updateIn([i, 'value'], v => v !== '*'
        ? m.count((n,j) => c.get('x') >= n.get('x')-1 && c.get('x') <= n.get('x')+1 
                        && c.get('y') >= n.get('y')-1 && c.get('y') <= n.get('y')+1 
                        && i != j && n.get('value') === '*')
        : '*'), cells));

const getDifficulty = (difficulty) => [
    {rows: 9, cols: 9, mines: 10},
    {rows: 16, cols: 16, mines: 40},
    {rows: 16, cols: 30, mines: 99}
  ][difficulty];
