import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import Button from '@material-ui/core/Button';
import { buttonShadow, buttonHoverShadow, identityBlue } from '../constants/colors';

const styles = theme => ({
  button: {
    width: '100%',
    height: '100%',
    minHeight: '100%',
    fontSize: '1.5rem',
    // fontWeight: 'bold',
    borderRadius: '50px',
    color: identityBlue,
    boxShadow: '',
    '&:hover': {
      boxShadow: buttonHoverShadow,
    },
  },
  whitespaces: {
    whiteSpace: 'pre',
  },

  root: {

  },
});

const BasicButton = (props) => {
  let { classes } = props;
  return (
    <Button
      size="large"
      color="primary"
      disabled={props.disabled}
      className={classes.button}
      classes={{
        disabled: props.classes.disabled ? props.classes.disabled : classes.disabled,
        root: props.classes.root ? props.classes.root : classes.button,
      }}
      onClick={props.handleClick}
      style={{ fontWeight: props.fontWeight, fontSize: props.fontSize, lineHeight: props.lineHeight, letterSpacing: '0.05em' }}
    >
      {props.buttonText}{props.buttonIcon &&
        <div className={classes.whitespaces}>  <img style={{ height: props.iconHeight }} src={props.buttonIcon} alt="ether" /></div>
      }
    </Button>
  );
};

BasicButton.propTypes = {
  classes: PropTypes.object.isRequired,
  // theme: PropTypes.object.isRequired,
};


export default withStyles(styles)(BasicButton);
