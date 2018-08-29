import Language from '../../models/Language';
import Translation from '../../models/Translation';

// Import translated resources
import navigator from './navigator';
import onboarding from './onboarding';
import transactions from './transactions';
import wallet from './wallet';
import completion from './completion';
import fields from './fields';
import stepper from './stepper';

const en = new Translation(
  new Language('ZH', 'zh-CN'),
  {
    navigator,
    onboarding,
    transactions,
    wallet,
    completion,
    fields,
    stepper,
  },
);

export default en;
