import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';

import { formatIotas, MAX_MESSAGE_LENGTH } from 'libs/iota/utils';
import { formatMonetaryValue } from 'libs/currency';

import SeedStore from 'libs/SeedStore';

import AddressInput from 'ui/components/input/Address';
import AmountInput from 'ui/components/input/Amount';
import TextInput from 'ui/components/input/Text';
import Icon from 'ui/components/Icon';
import Button from 'ui/components/Button';
import Progress from 'ui/components/Progress';
import Balance from 'ui/components/Balance';
import Checksum from 'ui/components/Checksum';
import Confirm from 'ui/components/modal/Confirm';
import withSendData from 'containers/wallet/Send';

import css from './send.scss';

/**
 * Send transaction component
 */
class Send extends React.PureComponent {
    static propTypes = {
        /** @ignore */
        fields: PropTypes.shape({
            address: PropTypes.string.isRequired,
            amount: PropTypes.string.isRequired,
            message: PropTypes.string.isRequired,
        }),
        /** @ignore */
        isSending: PropTypes.bool.isRequired,
        /** @ignore */
        password: PropTypes.object.isRequired,
        /** @ignore */
        accountMeta: PropTypes.object.isRequired,
        /** @ignore */
        accountName: PropTypes.string.isRequired,
        /** @ignore */
        availableBalance: PropTypes.number.isRequired,
        /** @ignore */
        settings: PropTypes.shape({
            conversionRate: PropTypes.number.isRequired,
            currency: PropTypes.string.isRequired,
            usdPrice: PropTypes.number.isRequired,
        }),
        /** @ignore */
        progress: PropTypes.shape({
            progress: PropTypes.number,
            title: PropTypes.string,
        }),
        /** @ignore */
        validateInputs: PropTypes.func.isRequired,
        /** @ignore */
        sendTransfer: PropTypes.func.isRequired,
        /** @ignore */
        setSendAddressField: PropTypes.func.isRequired,
        /** @ignore */
        setSendAmountField: PropTypes.func.isRequired,
        /** @ignore */
        setSendMessageField: PropTypes.func.isRequired,
        /** @ignore */
        t: PropTypes.func.isRequired,
        /** @ignore */
        themeName: PropTypes.string.isRequired,
    };

    state = {
        isTransferModalVisible: false,
        isUnitsVisible: false,
    };

    validateInputs = (e) => {
        const { validateInputs } = this.props;

        e.preventDefault();

        this.setState({
            isTransferModalVisible: validateInputs(),
        });
    };

    confirmTransfer = async () => {
        const { fields, password, accountName, accountMeta, sendTransfer } = this.props;

        this.setState({
            isTransferModalVisible: false,
        });

        const seedStore = await new SeedStore[accountMeta.type](password, accountName, accountMeta);

        const message =
            SeedStore[accountMeta.type].isMessageAvailable || parseInt(fields.amount || '0') === 0
                ? fields.message
                : '';

        sendTransfer(seedStore, fields.address, parseInt(fields.amount) || 0, message);
    };

    updateFields(address, message, amount) {
        this.props.setSendAddressField(address);
        if (message) {
            this.props.setSendMessageField(message);
        }
        if (amount) {
            if (typeof amount === 'number') {
                amount = amount.toString();
            }
            this.props.setSendAmountField(amount);
        }
    }

    render() {
        const { themeName, accountMeta, fields, isSending, availableBalance, settings, progress, t } = this.props;
        const { isTransferModalVisible, isUnitsVisible } = this.state;

        const transferContents =
            parseInt(fields.amount) > 0
                ? `${formatIotas(fields.amount, false, true)} (${formatMonetaryValue(
                      fields.amount,
                      settings.usdPrice * settings.conversionRate,
                      settings.currency,
                  )})`
                : t('transferConfirmation:aMessage');

        const isMessageAvailable = SeedStore[accountMeta.type].isMessageAvailable;

        return (
            <form className={css.send} onSubmit={(e) => this.validateInputs(e)}>
                <Balance />
                <div className={isSending ? css.sending : null}>
                    <Confirm
                        category="primary"
                        isOpen={isTransferModalVisible}
                        onCancel={() => this.setState({ isTransferModalVisible: false })}
                        onConfirm={() => this.confirmTransfer()}
                        themeName={themeName}
                        content={{
                            title: t('transferConfirmation:youAreAbout', { contents: transferContents }),
                            message: (
                                <div>
                                    <h1>{t('transferConfirmation:toAddress')}</h1>
                                    <span className={css.address}>
                                        <Checksum address={fields.address} />
                                    </span>
                                </div>
                            ),
                            confirm: t('send'),
                            cancel: t('cancel'),
                            animation: { name: 'sendingDesktop', loop: true, segments: [89, 624] },
                        }}
                    />
                    <AddressInput
                        id="recipient-address"
                        address={fields.address}
                        onChange={(address, message, amount) => {
                            this.updateFields(address, message, amount);
                        }}
                        label={t('send:recipientAddress')}
                        closeLabel={t('back')}
                    />
                    <AmountInput
                        id="send-amount"
                        amount={fields.amount}
                        settings={settings}
                        label={t('send:amount')}
                        labelMax={t('send:max')}
                        balance={availableBalance}
                        onChange={(value) => this.props.setSendAmountField(value)}
                    />
                    <TextInput
                        value={isMessageAvailable || parseInt(fields.amount || '0') === 0 ? fields.message : ''}
                        label={t('send:message')}
                        disabled={!isMessageAvailable && parseInt(fields.amount) > 0}
                        onChange={(value) => this.props.setSendMessageField(value)}
                        maxLength={MAX_MESSAGE_LENGTH}
                    />
                    <footer>
                        {!isSending ? (
                            <React.Fragment>
                                <Button to="/wallet/" variant="secondary" className="outlineSmall">
                                    {t('close')}
                                </Button>

                                <Button id="send-transaction" type="submit" className="small" variant="primary">
                                    {t('send:send')}
                                </Button>
                            </React.Fragment>
                        ) : (
                            <Progress {...progress} />
                        )}
                    </footer>
                </div>
                {!isUnitsVisible ? null : (
                    <div className={css.units} onClick={() => this.setState({ isUnitsVisible: false })}>
                        <div>
                            <h3>
                                <Icon icon="iota" size={32} />
                                {t('unitInfoModal:unitSystem')}
                            </h3>
                            <dl>
                                <dt>Ti</dt>
                                <dd>{t('unitInfoModal:trillion')}</dd>
                                <dd>1 000 000 000 000</dd>
                            </dl>
                            <dl>
                                <dt>Gi</dt>
                                <dd>{t('unitInfoModal:billion')}</dd>
                                <dd>1 000 000 000</dd>
                            </dl>
                            <dl>
                                <dt>Mi</dt>
                                <dd>{t('unitInfoModal:million')}</dd>
                                <dd>1 000 000</dd>
                            </dl>
                            <dl>
                                <dt>Ki</dt>
                                <dd>{t('unitInfoModal:thousand')}</dd>
                                <dd>1 000</dd>
                            </dl>
                            <dl>
                                <dt>i</dt>
                                <dd>{t('unitInfoModal:one')}</dd>
                                <dd>1</dd>
                            </dl>
                        </div>
                    </div>
                )}
            </form>
        );
    }
}

export default withTranslation()(withSendData(Send));
