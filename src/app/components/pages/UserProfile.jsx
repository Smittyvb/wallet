/* eslint react/prop-types: 0 */
import React from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { browserHistory } from 'react-router';
import classnames from 'classnames';
import * as globalActions from 'app/redux/GlobalReducer';
import * as transactionActions from 'app/redux/TransactionReducer';
import * as userActions from 'app/redux/UserReducer';
import { actions as fetchDataSagaActions } from 'app/redux/FetchDataSaga';
import Icon from 'app/components/elements/Icon';
import UserKeys from 'app/components/elements/UserKeys';
import PasswordReset from 'app/components/elements/PasswordReset';
import UserWallet from 'app/components/modules/UserWallet';
import Settings from 'app/components/modules/Settings';
import UserList from 'app/components/elements/UserList';
import Follow from 'app/components/elements/Follow';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import { isFetchingOrRecentlyUpdated } from 'app/utils/StateFunctions';
import { repLog10 } from 'app/utils/ParsersAndFormatters.js';
import Tooltip from 'app/components/elements/Tooltip';
import DateJoinWrapper from 'app/components/elements/DateJoinWrapper';
import tt from 'counterpart';
import { List } from 'immutable';
import WalletSubMenu from 'app/components/elements/WalletSubMenu';
import Userpic from 'app/components/elements/Userpic';
import Callout from 'app/components/elements/Callout';
import normalizeProfile from 'app/utils/NormalizeProfile';
import userIllegalContent from 'app/utils/userIllegalContent';
import proxifyImageUrl from 'app/utils/ProxifyUrl';
import ArticleLayoutSelector from 'app/components/modules/ArticleLayoutSelector';
import SanitizedLink from 'app/components/elements/SanitizedLink';
import DropdownMenu from 'app/components/elements/DropdownMenu';

export default class UserProfile extends React.Component {
    constructor() {
        super();
        this.state = { showResteem: true };
        this.onPrint = () => {
            window.print();
        };
    }

    shouldComponentUpdate(np, ns) {
        const { follow, follow_count, account, accountname } = this.props;

        let followersLoading = false,
            npFollowersLoading = false;
        let followingLoading = false,
            npFollowingLoading = false;

        if (follow) {
            followersLoading = follow.getIn(
                ['getFollowersAsync', accountname, 'blog_loading'],
                false
            );
            followingLoading = follow.getIn(
                ['getFollowingAsync', accountname, 'blog_loading'],
                false
            );
        }
        if (np.follow) {
            npFollowersLoading = np.follow.getIn(
                ['getFollowersAsync', accountname, 'blog_loading'],
                false
            );
            npFollowingLoading = np.follow.getIn(
                ['getFollowingAsync', accountname, 'blog_loading'],
                false
            );
        }

        return (
            np.current_user !== this.props.current_user ||
            np.account !== this.props.account ||
            np.wifShown !== this.props.wifShown ||
            np.global_status !== this.props.global_status ||
            (npFollowersLoading !== followersLoading && !npFollowersLoading) ||
            (npFollowingLoading !== followingLoading && !npFollowingLoading) ||
            np.loading !== this.props.loading ||
            np.location.pathname !== this.props.location.pathname ||
            np.follow_count !== this.props.follow_count ||
            ns.showResteem !== this.state.showResteem
        );
    }

    componentWillUnmount() {
        this.props.clearTransferDefaults();
        this.props.clearPowerdownDefaults();
    }

    render() {
        const {
            state: { showResteem },
            props: {
                current_user,
                wifShown,
                global_status,
                follow,
                accountname,
            },
            onPrint,
        } = this;
        const username = current_user ? current_user.get('username') : null;

        let { section } = this.props.routeParams;
        if (!section) section = 'transfers';

        // Loading status
        const status = global_status
            ? global_status.getIn([section, 'by_author'])
            : null;
        const fetching = (status && status.fetching) || this.props.loading;

        let account;
        let accountImm = this.props.account;
        if (accountImm) {
            account = accountImm.toJS();
        } else if (fetching) {
            return (
                <center>
                    <LoadingIndicator type="circle" />
                </center>
            );
        } else {
            return (
                <div>
                    <center>{tt('user_profile.unknown_account')}</center>
                </div>
            );
        }
        const followers =
            follow && follow.getIn(['getFollowersAsync', accountname]);
        const following =
            follow && follow.getIn(['getFollowingAsync', accountname]);

        // instantiate following items
        let totalCounts = this.props.follow_count;
        let followerCount = 0;
        let followingCount = 0;

        if (totalCounts && accountname) {
            totalCounts = totalCounts.get(accountname);
            if (totalCounts) {
                totalCounts = totalCounts.toJS();
                followerCount = totalCounts.follower_count;
                followingCount = totalCounts.following_count;
            }
        }

        const rep = repLog10(account.reputation);

        const isMyAccount = username === account.name;
        let tab_content = null;

        let walletClass = '';
        if (section === 'transfers') {
            walletClass = 'active';
            tab_content = (
                <div>
                    <UserWallet
                        account={accountImm}
                        showTransfer={this.props.showTransfer}
                        showPowerdown={this.props.showPowerdown}
                        current_user={current_user}
                        withdrawVesting={this.props.withdrawVesting}
                    />
                </div>
            );
        } else if (section === 'followers') {
            if (followers && followers.has('blog_result')) {
                tab_content = (
                    <div>
                        <UserList
                            title={tt('user_profile.followers')}
                            account={account}
                            users={followers.get('blog_result')}
                        />
                    </div>
                );
            }
        } else if (section === 'followed') {
            if (following && following.has('blog_result')) {
                tab_content = (
                    <UserList
                        title="Followed"
                        account={account}
                        users={following.get('blog_result')}
                    />
                );
            }
        } else if (section === 'settings') {
            tab_content = <Settings routeParams={this.props.routeParams} />;
        } else if (section === 'comments') {
            tab_content = <div />;
        } else if (!section || section === 'blog') {
            tab_content = <div />;
        } else if (section === 'recent-replies') {
            tab_content = <div />;
        } else if (section === 'permissions' && isMyAccount) {
            walletClass = 'active';
            tab_content = (
                <div>
                    <div className="row">
                        <div className="column">
                            <WalletSubMenu account_name={account.name} />
                        </div>
                    </div>
                    <br />
                    <UserKeys account={accountImm} />
                </div>
            );
        } else if (section === 'password') {
            walletClass = 'active';
            tab_content = (
                <div>
                    <div className="row">
                        <div className="column">
                            <WalletSubMenu account_name={account.name} />
                        </div>
                    </div>
                    <br />
                    <PasswordReset account={accountImm} />
                </div>
            );
        } else {
            //    console.log( "no matches" );
        }

        // detect illegal users
        if (userIllegalContent.includes(accountname)) {
            tab_content = <div>Unavailable For Legal Reasons.</div>;
        }

        var page_title = '';
        // Page title

        if (isMyAccount) {
            if (section === 'blog') {
                page_title = tt('g.my_blog');
            } else if (section === 'comments') {
                page_title = tt('g.my_comments');
            } else if (section === 'recent-replies') {
                page_title = tt('g.my_replies');
            } else if (section === 'settings') {
                page_title = tt('g.settings');
            }
        } else {
            if (section === 'blog') {
                page_title = tt('g.blog');
            } else if (section === 'comments') {
                page_title = tt('g.comments');
            } else if (section === 'recent-replies') {
                page_title = tt('g.replies');
            } else if (section === 'settings') {
                page_title = tt('g.settings');
            }
        }

        const layoutClass = 'layout-list';

        const blog_header = (
            <div>
                <div className="articles__header">
                    <div className="articles__header-col">
                        <h1 className="articles__h1">{page_title}</h1>
                    </div>
                    <div className="articles__header-col articles__header-col--right">
                        <ArticleLayoutSelector />
                    </div>
                </div>
                <hr className="articles__hr" />
            </div>
        );

        if (
            !(
                section === 'transfers' ||
                section === 'permissions' ||
                section === 'password'
            )
        ) {
            tab_content = (
                <div className="row">
                    <div
                        className={classnames(
                            'UserProfile__tab_content',
                            'column',
                            layoutClass,
                            section
                        )}
                    >
                        <article className="articles">
                            {section === 'blog' || 'comments'
                                ? blog_header
                                : null}
                            {tab_content}
                        </article>
                    </div>
                </div>
            );
        }

        let printLink = null;
        if (section === 'permissions') {
            if (isMyAccount && wifShown) {
                printLink = (
                    <div>
                        <a className="float-right noPrint" onClick={onPrint}>
                            <Icon name="printer" />&nbsp;{tt('g.print')}&nbsp;&nbsp;
                        </a>
                    </div>
                );
            }
        }

        const top_menu = (
            <div className="row UserProfile__top-menu">
                <div className="columns shrink">
                    <ul className="menu" style={{ flexWrap: 'wrap' }}>
                        <li>
                            <a
                                href={`/@${accountname}/transfers`}
                                className={walletClass}
                                onClick={e => {
                                    e.preventDefault();
                                    browserHistory.push(e.target.pathname);
                                    return false;
                                }}
                            >
                                {tt('g.wallet')}
                            </a>
                        </li>
                        {isMyAccount && (
                            <li>
                                <Link
                                    to={`/@${accountname}/settings`}
                                    activeClassName="active"
                                >
                                    {tt('g.settings')}
                                </Link>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        );

        const {
            name,
            location,
            about,
            website,
            cover_image,
        } = normalizeProfile(account);
        const website_label = website
            ? website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
            : null;

        let cover_image_style = {};
        if (cover_image) {
            cover_image_style = {
                backgroundImage:
                    'url(' + proxifyImageUrl(cover_image, '2048x512') + ')',
            };
        }

        return (
            <div className="UserProfile">
                <div className="UserProfile__banner row expanded">
                    <div className="column" style={cover_image_style}>
                        <div style={{ position: 'relative' }}>
                            <div className="UserProfile__buttons hide-for-small-only">
                                <Follow
                                    follower={username}
                                    following={accountname}
                                />
                            </div>
                        </div>
                        <h1>
                            <Userpic account={account.name} hideIfDefault />
                            {name || account.name}{' '}
                            <Tooltip
                                t={tt(
                                    'user_profile.this_is_users_reputations_score_it_is_based_on_history_of_votes',
                                    { name: accountname }
                                )}
                            >
                                <span className="UserProfile__rep">
                                    ({rep})
                                </span>
                            </Tooltip>
                        </h1>

                        <div>
                            {about && (
                                <p className="UserProfile__bio">{about}</p>
                            )}
                            <div className="UserProfile__stats">
                                <span>
                                    <Link to={`/@${accountname}/followers`}>
                                        {tt('user_profile.follower_count', {
                                            count: followerCount,
                                        })}
                                    </Link>
                                </span>
                                <span>
                                    <Link to={`/@${accountname}`}>
                                        {tt('user_profile.post_count', {
                                            count: account.post_count || 0,
                                        })}
                                    </Link>
                                </span>
                                <span>
                                    <Link to={`/@${accountname}/followed`}>
                                        {tt('user_profile.followed_count', {
                                            count: followingCount,
                                        })}
                                    </Link>
                                </span>
                            </div>
                            <p className="UserProfile__info">
                                {location && (
                                    <span>
                                        <Icon name="location" /> {location}
                                    </span>
                                )}
                                {website && (
                                    <span>
                                        <Icon name="link" />{' '}
                                        <SanitizedLink
                                            url={website}
                                            text={website_label}
                                        />
                                    </span>
                                )}
                                <Icon name="calendar" />{' '}
                                <DateJoinWrapper date={account.created} />
                            </p>
                        </div>
                        <div className="UserProfile__buttons_mobile show-for-small-only">
                            <Follow
                                follower={username}
                                following={accountname}
                                what="blog"
                            />
                        </div>
                    </div>
                </div>
                <div className="UserProfile__top-nav row expanded noPrint">
                    {top_menu}
                </div>
                <div>{printLink}</div>
                <div>{tab_content}</div>
            </div>
        );
    }
}

module.exports = {
    path: '@:accountname(/:section)',
    component: connect(
        (state, ownProps) => {
            const wifShown = state.global.get('UserKeys_wifShown');
            const current_user = state.user.get('current');
            const accountname = ownProps.routeParams.accountname.toLowerCase();

            return {
                discussions: state.global.get('discussion_idx'),
                current_user,
                wifShown,
                loading: state.app.get('loading'),
                global_status: state.global.get('status'),
                accountname: accountname,
                account: state.global.getIn(['accounts', accountname]),
                follow: state.global.get('follow'),
                follow_count: state.global.get('follow_count'),
            };
        },
        dispatch => ({
            login: () => {
                dispatch(userActions.showLogin());
            },
            clearTransferDefaults: () => {
                dispatch(userActions.clearTransferDefaults());
            },
            showTransfer: transferDefaults => {
                dispatch(userActions.setTransferDefaults(transferDefaults));
                dispatch(userActions.showTransfer());
            },
            clearPowerdownDefaults: () => {
                dispatch(userActions.clearPowerdownDefaults());
            },
            showPowerdown: powerdownDefaults => {
                console.log('power down defaults:', powerdownDefaults);
                dispatch(userActions.setPowerdownDefaults(powerdownDefaults));
                dispatch(userActions.showPowerdown());
            },
            withdrawVesting: ({
                account,
                vesting_shares,
                errorCallback,
                successCallback,
            }) => {
                const successCallbackWrapper = (...args) => {
                    dispatch(
                        globalActions.getState({ url: `@${account}/transfers` })
                    );
                    return successCallback(...args);
                };
                dispatch(
                    transactionActions.broadcastOperation({
                        type: 'withdraw_vesting',
                        operation: { account, vesting_shares },
                        errorCallback,
                        successCallback: successCallbackWrapper,
                    })
                );
            },
            requestData: args =>
                dispatch(fetchDataSagaActions.requestData(args)),
        })
    )(UserProfile),
};
