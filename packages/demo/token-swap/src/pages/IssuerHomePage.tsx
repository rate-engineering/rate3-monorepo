import * as React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { RouteComponentProps } from 'react-router-dom';
import { Dispatch } from 'redux';

import { createStyles } from '@material-ui/core/styles';
import withStyles, { WithStyles } from '@material-ui/core/styles/withStyles';

import * as networkActions from '../actions/network';
import RoleContext from '../components/common/RoleContext';
import AwaitingApprovalList from '../components/issuer/AwaitingApprovalList';
import HistoryList from '../components/issuer/HistoryList';
import Box from '../components/layout/Box';
import PageBox from '../components/layout/PageBox';
import PageContainer from '../components/layout/PageContainer';
import PageTitle from '../components/layout/PageTitle';
import withTracker from '../components/WithTracker';
import { COLORS } from '../constants/colors';
import { ROLES } from '../constants/general';
import { IE2SRequest, IS2ERequest } from '../reducers/issuer';
import { initialState, IStoreState } from '../reducers/network';
import { calEthTodaySwapNo, calStellarTodaySwapNo, Direction, IAction } from '../utils/general';
import HistorySwapDetailsPage from './HistorySwapDetailsPage';
import SwapApprovalPage from './SwapApprovalPage';
import SwapDetailsPage from './SwapDetailsPage';

// export interface IProps {
//   classes: any;
// }

const styles = createStyles({
  row: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  boxConstraint: {
    width: '40%',
  },
  thinSmallText: {
    color: COLORS.blue,
    fontSize: '1rem',
    fontWeight: 100,
    margin: '0.5rem 0 2rem 0',
    cursor: 'pointer',
  },
  thinText: {
    color: COLORS.grey,
    fontSize: '1.5rem',
    fontWeight: 100,
    margin: '1rem 0 2rem 0',
  },
  swapNumber: {
    color: COLORS.black,
    fontSize: '3rem',
    fontWeight: 500,
    margin: '1rem 0',
  },
  boxLabelNoMargin: {
    color: COLORS.grey,
    fontSize: '1.5rem',
    fontWeight: 100,
    alignSelf: 'flex-start',
    margin: '0rem 0 1rem 0',
  },
  boxLabel: {
    color: COLORS.grey,
    fontSize: '1.5rem',
    fontWeight: 100,
    alignSelf: 'flex-start',
    margin: '2.5rem 0 1rem 0',
  },
});
interface IProps {
  pendingTxMap: typeof initialState.pendingTxMap;
  selectedTx: string;
  stellarHistory: any[];
  ethHistory: any[];
  resetSelectedTx: () => void;
  initUser: () => void;
  initIssuer: () => void;
}
interface IState {
  page: number;
  currentApproval: null | IE2SRequest | IS2ERequest;
  selectedHistory: null | IE2SRequest | IS2ERequest;
}
type IPropsFinal = IProps & WithStyles<typeof styles> & RouteComponentProps;
class IssuerHomePage extends React.Component<IPropsFinal> {
  static contextType = RoleContext;
  state: IState;
  constructor(props: any) {
    super(props);
    this.goBack = this.goBack.bind(this);
    // this.goTo = this.goBack.bind(this);
    this.next = this.next.bind(this);
    this.state = {
      page: 1,
      currentApproval: null,
      selectedHistory: null,
    };
  }

  switchTo = (role: ROLES) => {
    this.props.resetSelectedTx();
    if (this.context.theme === ROLES.ISSUER) {
      this.props.initUser();
    } else {
      this.props.initIssuer();
    }
    if (role === ROLES.USER) {
      this.context.setRole(ROLES.USER);
      this.props.history.push('/user/direct-swap');
      sessionStorage.setItem('role', 'user');
    } else {
      this.context.setRole(ROLES.ISSUER);
      this.props.history.push('/issuer/home');
      sessionStorage.setItem('role', 'issuer');
    }
  }
  setCurrentApproval = (value) => {
    this.setState({
      currentApproval: value,
    });
  }
  setSelectedHistory = (value) => {
    this.setState({
      selectedHistory: value,
    });
  }
  goBack = () => {
    this.setState({
      page: this.state.page - 1 < 0 ? 0 : this.state.page - 1,
    });
    this.props.resetSelectedTx();
  }
  goHome = () => {
    this.goTo(1);
  }
  goTo = (pg: number) => {
    this.setState({
      page: pg,
    });
    this.props.resetSelectedTx();
  }
  next = () => {
    this.setState({
      page: this.state.page + 1 > 3 ? 3 : this.state.page + 1,
    });
  }
  render() {
    const { classes,
      stellarHistory,
      ethHistory } = this.props;
    const swapNo = calStellarTodaySwapNo(stellarHistory) + calEthTodaySwapNo(ethHistory);
    let amount = '';
    let direction = Direction.S2E;
    if (this.state.currentApproval) {
      amount = this.state.currentApproval.amount;
      if ('indexID' in this.state.currentApproval) {
        direction = Direction.E2S;
      }
    }
    return (
      <>
        {this.state.page === 1 &&
          <PageBox>
            <PageTitle>
              HOME
            </PageTitle>
            <PageContainer>
              <span className={classes.boxLabelNoMargin}>Overview</span>
              <div className={classes.row}>
                <div className={classes.boxConstraint}>
                  <Box fullHeight>
                    <div className={classes.swapNumber}>
                      {swapNo}
                    </div>
                    <div className={classes.thinText}>
                      Swaps Today
                    </div>
                  </Box>
                </div>
                <div className={classes.boxConstraint}>
                  <Box fullHeight>
                    <div className={classes.thinText}>
                      Navigation
                    </div>
                    <div
                      className={classes.thinSmallText}
                      onClick={() => {
                        this.switchTo(ROLES.USER);
                      }}
                    >
                      Make a Direct Swap >
                    </div>
                    <div
                      className={classes.thinSmallText}
                      onClick={() => {
                        this.switchTo(ROLES.ISSUER);
                      }}
                    >
                      Approve a Direct Swap >
                    </div>
                  </Box>
                </div>
              </div>
              <span className={classes.boxLabel}>Approval Needed</span>
              <Box>
                <AwaitingApprovalList
                  next={this.next}
                  goBack={this.goBack}
                  setCurrentApproval={this.setCurrentApproval}
                />
              </Box>
              <span className={classes.boxLabel}>In Progress</span>
              <Box>
                <HistoryList
                  inProgressForIssuer
                  next={this.next}
                  goBack={this.goBack}
                  goTo={this.goTo}
                  setSelectedHistory={this.setSelectedHistory}
                />
              </Box>
              <span className={classes.boxLabel}>History</span>
              <Box>
                <HistoryList
                  next={this.next}
                  goBack={this.goBack}
                  goTo={this.goTo}
                  setSelectedHistory={this.setSelectedHistory}
                />
              </Box>
            </PageContainer>
          </PageBox>
        }
        {this.state.page === 2 &&
        <SwapApprovalPage
          currentApproval={this.state.currentApproval}
          next={this.next}
          goBack={this.goBack}
        />}
        {this.state.page === 3 &&
        <SwapDetailsPage
          value={amount}
          direction={direction}
          goBack={this.goHome}
          next={this.next}
          pendingTxMap={this.props.pendingTxMap}
          selectedTx={this.props.selectedTx}
        />}
        {this.state.page === 4 &&
        <HistorySwapDetailsPage
          currentSelectedHistory={this.state.selectedHistory}
          goBack={this.goHome}
          next={this.next}
        />}
      </>
    );
  }
}
export function mapStateToProps({ network }: { network: IStoreState; }) {
  return {
    pendingTxMap: network.pendingTxMap,
    selectedTx: network.selectedTx,
    stellarHistory: network.stellarHistory,
    ethHistory: network.ethHistory,
  };
}
export function mapDispatchToProps(dispatch: Dispatch<IAction>) {
  return {
    resetSelectedTx: () => dispatch(networkActions.resetSelectedTx()),
    initUser: () => dispatch(networkActions.initUser()),
    initIssuer: () => dispatch(networkActions.initIssuer()),
  };
}
export default connect(
  mapStateToProps, mapDispatchToProps)(withStyles(styles)(withRouter(withTracker(IssuerHomePage))));
