import React from 'react';
import PropTypes from 'prop-types';
import { Trans, translate } from 'react-i18next';

import { withStyles } from '@material-ui/core/styles';

import List from '../../components/onboarding/List';
import RadioGroup from '../../components/onboarding/RadioGroup';
import Button from '../../components/Button';
import { setUpStepStyles } from './_styles';
import { compose } from '../../utils';


class SetUpUserWallet extends React.Component {
  state = {
    userEthWallet: null,
  }

  handleWalletChange = (e) => {
    const newValue = e.target.value;
    const { setContext } = this.props;

    this.setState({ userEthWallet: newValue }, () => {
      setContext(ctx => ({ ...ctx, userEthWallet: newValue }));
    });
  }

  render() {
    const {
      classes,
      t,
      handlePrevStep,
      handleNextStep,
    } = this.props;
    const { userEthWallet } = this.state;

    return (
      <div className={classes.root}>
        <h1>
          <Trans i18nKey="onboarding:stepNumber">
            Step
            {{ stepNumber: 3 }}
            :
          </Trans>
          &nbsp;
          {t('onboarding:setUpUserWallet')}
        </h1>
        <List>
          <Trans key="userSetUpWalletDesc1" i18nKey="onboarding:userSetUpWalletDesc1">
            ETH wallet address is your <strong>unique identifier</strong>.
          </Trans>
          <Trans key="userSetUpWalletDesc2" i18nKey="onboarding:userSetUpWalletDesc2">
            ETH wallet is used to submit tokenization and withdrawal requests.
          </Trans>
        </List>
        <h2 className={classes.subheader}>{t('onboarding:selectETHWallet')}</h2>

        <RadioGroup
          aria-label="Ethereum Wallet"
          name="userEthWallet"
          className={classes.radioGroup}
          value={userEthWallet}
          onChange={this.handleWalletChange}
          classes={{
            radio: classes.radioRoot,
            label: classes.labelRoot,
          }}
          items={[
            {
              key: '0x687422eea2cb73b5d3e242ba5456b782919afc85',
              value: '0x687422eea2cb73b5d3e242ba5456b782919afc85',
              label: (
                <div>
                  <div><strong>Stan Smith</strong></div>
                  <div>0x687422eea2cb73b5d3e242ba5456b782919afc85</div>
                </div>
              ),
            },
          ]}
        />
        <div className={classes.buttonsGroup}>
          <Button
            onClick={handlePrevStep}
            isUser
          >
            {t('back')}
          </Button>
          <Button
            onClick={handleNextStep}
            color="primary"
            isUser
            disabled={!userEthWallet}
          >
            {t('finish')}
          </Button>
        </div>
      </div>
    );
  }
}

SetUpUserWallet.propTypes = {
  classes: PropTypes.object.isRequired,
  t: PropTypes.func.isRequired, // translate prop passed in from translate HOC
  handlePrevStep: PropTypes.func.isRequired,
  handleNextStep: PropTypes.func.isRequired,
  setContext: PropTypes.func.isRequired,
};

const enhance = compose(
  withStyles(setUpStepStyles, { withTheme: true }),
  translate(['navigator', 'onboarding']),
);

export default enhance(SetUpUserWallet);
