import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { observer, inject } from 'mobx-react';
import { Route, Switch, withRouter } from 'react-router-dom';
import Onboard from './Onboard';

import HomeSidebar from '../components/HomeSidebar';
import { homeBg } from '../constants/colors';
import UserMain from './UserMain';
import VerifierMain from './VerifierMain';
import Faq from './Faq';
import Settings from './Settings';

const styles = theme => ({
  root: {
    display: 'flex',
    flexDirection: 'row',
    overflow: 'auto',
    height: '100%',
    backgroundColor: homeBg,
  },
  main: {
    width: 'calc(100vw - 20rem)',
    padding: '5.5em 4em 10em 5em',
    marginLeft: '20rem',
  },
});

@inject('RootStore') @observer
class Home extends React.Component {
  componentDidMount() {
  }
  render() {
    if (this.props.location.pathname === '/') {
      return <Onboard />;
    }
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        <HomeSidebar />
        <div className={classes.main}>
          <Switch>
            <Route exact path="/user" component={UserMain} />
            <Route exact path="/verifier" component={VerifierMain} />
            <Route exact path="/verifier/faq" component={Faq} />
            <Route exact path="/verifier/settings" component={Settings} />
            <Route exact path="/user/faq" component={Faq} />
            <Route exact path="/user/settings" component={Settings} />
          </Switch>
        </div>
      </div>
    );
  }
}

Home.propTypes = {
  
};

export default withStyles(styles)(withRouter(Home));
