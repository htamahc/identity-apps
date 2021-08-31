/**
 * Copyright (c) 2021, WSO2 Inc. (http://www.wso2.com). All Rights Reserved.
 *
 * This software is the property of WSO2 Inc. and its suppliers, if any.
 * Dissemination of any information or reproduction of any material contained
 * herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
 * You may not alter or remove any copyright or other notice from copies of this content."
 */

import { UserstoreConstants } from "@wso2is/core/constants";
import { resolveUserstore, hasRequiredScopes, isFeatureEnabled } from "@wso2is/core/helpers";
import { LoadableComponentInterface, SBACInterface, TestableComponentInterface } from "@wso2is/core/models";
import { CommonUtils } from "@wso2is/core/utils";
import {
    ConfirmationModal,
    DataTable,
    EmptyPlaceholder,
    LinkButton,
    TableActionsInterface,
    TableColumnInterface,
    UserAvatar
} from "@wso2is/react-components";
import React, { ReactElement, ReactNode, SyntheticEvent, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Header, Icon, ListItemProps, Popup, SemanticICONS } from "semantic-ui-react";
import {
    AppState,
    FeatureConfigInterface,
    UIConstants,
    getEmptyPlaceholderIllustrations,
    history
} from "../../../../../features/core";
import { RealmConfigInterface } from "../../../../../features/server-configurations";
import { UserManagementConstants } from "../../../../../features/users/constants";
import { UserBasicInterface, UserListInterface } from "../../../../../features/users/models";
import { CONSUMER_USERSTORE } from "../../../../../features/userstores";
import { UsersConstants } from "../../constants";
import { UserAccountSources } from "../../pages";
import { SCIMConfigs } from "../../../../configs/scim";
import { MultiValueAttributeInterface } from "@wso2is/core/models";

/**
 * Prop types for the user list component.
 */
interface ConsumerUsersListProps extends SBACInterface<FeatureConfigInterface>, LoadableComponentInterface,
    TestableComponentInterface {

    /**
     * Advanced Search component.
     */
    advancedSearch?: ReactNode;
    /**
     * Default list item limit.
     */
    defaultListItemLimit?: number;
    /**
     * User delete callback.
     *
     * @param {string} userId - ID of the deleting user.
     */
    handleUserDelete?: (userId: string) => void;
    /**
     * Callback to inform the new set of visible columns.
     * @param {TableColumnInterface[]} columns - New columns.
     */
    onColumnSelectionChange?: (columns: TableColumnInterface[]) => void;
    /**
     * Callback to be fired when the empty list placeholder action is clicked.
     */
    onEmptyListPlaceholderActionClick?: () => void;
    /**
     * On list item select callback.
     */
    onListItemClick?: (event: SyntheticEvent, data: ListItemProps) => void;
    /**
     * Callback for the search query clear action.
     */
    onSearchQueryClear?: () => void;
    /**
     * Admin user details content.
     */
    realmConfigs: RealmConfigInterface;
    /**
     * Search query for the list.
     */
    searchQuery?: string;
    /**
     * Enable selection styles.
     */
    selection?: boolean;
    /**
     * Show list item actions.
     */
    showListItemActions?: boolean;
    /**
     * Show/Hide meta content.
     */
    showMetaContent?: boolean;
    /**
     * Meta column list for the user list.
     */
    userMetaListContent?: Map<string, string>;
    /**
     * Users list.
     */
    usersList: UserListInterface;
    /**
     * List of readOnly user stores.
     */
    readOnlyUserStores?: string[];
    /**
     * Path to edit user page.
     */
    userEditPath?: string;
    /**
     * Flag for request loading status.
     */
    isLoading: boolean;
}

/**
 * Users info page.
 *
 * @return {ReactElement}
 */
export const ConsumerUsersList: React.FunctionComponent<ConsumerUsersListProps> = (
    props: ConsumerUsersListProps): ReactElement => {
    const {
        advancedSearch,
        defaultListItemLimit,
        handleUserDelete,
        isLoading,
        readOnlyUserStores,
        featureConfig,
        onColumnSelectionChange,
        onEmptyListPlaceholderActionClick,
        onListItemClick,
        onSearchQueryClear,
        realmConfigs,
        searchQuery,
        selection,
        showListItemActions,
        showMetaContent,
        userMetaListContent,
        usersList,
        [ "data-testid" ]: testId
    } = props;

    const { t } = useTranslation();

    const [ showDeleteConfirmationModal, setShowDeleteConfirmationModal ] = useState<boolean>(false);
    const [ deletingUser, setDeletingUser ] = useState<UserBasicInterface>(undefined);

    const allowedScopes: string = useSelector((state: AppState) => state?.auth?.scope);
    const authenticatedUser: string = useSelector((state: AppState) => state?.auth?.username);

    const handleUserEdit = (userId: string) => {
        history.push(UsersConstants.getPaths().get("CUSTOMER_USER_EDIT_PATH").replace(":id", userId));
    };

    const deleteUser = (id: string): void => {
        handleUserDelete(id);
        setDeletingUser(undefined);
        setShowDeleteConfirmationModal(false);
    };

    /**
     * Resolves data table columns.
     *
     * @return {TableColumnInterface[]}
     */
    const resolveTableColumns = (): TableColumnInterface[] => {
        const defaultColumns: TableColumnInterface[] = [
            {
                allowToggleVisibility: false,
                dataIndex: "name",
                id: "name",
                key: "name",
                render: (user: UserBasicInterface): ReactNode => {
                    let header: string | MultiValueAttributeInterface;
                    let subHeader: string | MultiValueAttributeInterface;
                    const isNameAvailable = user.name?.familyName === undefined && user.name?.givenName === undefined;

                    if (user[ SCIMConfigs.scim.enterpriseSchema ]?.userSourceId) {
                        subHeader = user.emails[0]
                            ? user.emails[0]
                            : user.id;

                        header = (user.name && user.name.givenName !== undefined)
                            ? user.name.givenName + " " + (user.name.familyName ? user.name.familyName : "")
                            : subHeader;

                    } else {
                        subHeader = user.userName.split("/")?.length > 1
                            ? user.userName.split("/")[ 1 ]
                            : user.userName.split("/")[ 0 ];

                        header = (user.name && user.name.givenName !== undefined)
                            ? user.name.givenName + " " + (user.name.familyName ? user.name.familyName : "")
                            : subHeader;
                    }

                    return (
                        <Header
                            image
                            as="h6"
                            className="header-with-icon"
                            data-testid={ `${ testId }-item-heading` }
                        >
                            <UserAvatar
                                data-testid="consumer-users-list-item-image"
                                name={ user.userName.split("/")?.length > 1
                                    ? user.userName.split("/")[ 1 ]
                                    : user.userName.split("/")[ 0 ]
                                }
                                size="mini"
                                image={ user.profileUrl }
                                spaced="right"
                            />
                            <Header.Content>
                                <div className={ isNameAvailable ? "mt-2" : "" }>{ header }</div>
                                {
                                    (!isNameAvailable) &&
                                    <Header.Subheader
                                        data-testid={ `${ testId }-item-sub-heading` }
                                    >
                                        { subHeader }
                                    </Header.Subheader>
                                }
                            </Header.Content>
                        </Header>
                    );
                },
                title: "User"
            },
            {
                allowToggleVisibility: false,
                dataIndex: "idpType",
                id: "idpType",
                key: "idpType",
                title: (
                    <>
                        <div className={ "header-with-popup" }>
                            <span>
                                { t("extensions:manage.users.list.columns.idpType") }
                            </span>
                            <Popup
                                trigger={
                                    <div className="inline" >
                                        <Icon disabled name="info circle" className="link pointing pl-1" />
                                    </div>
                                }
                                content={ t("extensions:manage.users.list.popups.content.AccountTypeContent") }
                                position="top center"
                                size="mini"
                                hideOnScroll
                                inverted
                            />
                        </div>
                    </>
                ),
                render: (user: UserBasicInterface): ReactNode => {
                    if (user[ SCIMConfigs.scim.enterpriseSchema ]?.idpType) {
                        return user[ SCIMConfigs.scim.enterpriseSchema ]?.idpType;
                    } else {
                        return "N/A"
                    }
                }
            },
            {
                allowToggleVisibility: false,
                dataIndex: "userStore",
                id: "userStore",
                key: "userStore",
                title: (
                <>
                    <div className={ "header-with-popup" }>
                        <span>
                            { t("extensions:manage.users.list.columns.userStore") }
                        </span>
                        <Popup
                            trigger={
                                <div className="inline" >
                                    <Icon disabled name="info circle" className="link pointing pl-1" />
                                </div>
                            }
                            content={ t("extensions:manage.users.list.popups.content.sourceContent") }
                            position="top center"
                            size="mini"
                            hideOnScroll
                            inverted
                        />
                    </div>
                </>),
                render: (user: UserBasicInterface): ReactNode => {
                    if (user[ SCIMConfigs.scim.enterpriseSchema ]?.userSource) {
                        return user[ SCIMConfigs.scim.enterpriseSchema ]?.userSource;
                    } else {
                        return "N/A";
                    }
                }
            },
            {
                allowToggleVisibility: false,
                dataIndex: "action",
                id: "actions",
                key: "actions",
                textAlign: "right",
                title: ""
            }
        ];

        if (!showMetaContent || !userMetaListContent) {
            return defaultColumns;
        }

        const dynamicColumns: TableColumnInterface[]= [];

        for (const [key, value] of userMetaListContent.entries()) {
            if (key === "name" || key === "emails" || key === "profileUrl" || value === "") {
                continue;
            }

            let dynamicColumn: TableColumnInterface = {
                allowToggleVisibility: true,
                dataIndex: value,
                id: key,
                key: key,
                title: value
            };

            if (key === "meta.lastModified") {
                dynamicColumn = {
                    ...dynamicColumn,
                    render: (user: UserBasicInterface): ReactNode =>
                        CommonUtils.humanizeDateDifference(user?.meta?.lastModified)
                };
            }

            if(key === "userName") {
                dynamicColumn = {
                    ...dynamicColumn,
                    render: (user: UserBasicInterface): ReactNode =>
                        user.userName.split("/").length > 1 ? user.userName.split("/")[1] : user.userName
                };
            }

            dynamicColumns.push(dynamicColumn);
        }

        dynamicColumns.unshift(defaultColumns[0]);
        dynamicColumns.push(defaultColumns[1]);

        return dynamicColumns;
    };

    /**
     * Resolves data table actions.
     *
     * @return {TableActionsInterface[]}
     */
    const resolveTableActions = (): TableActionsInterface[] => {
        if (!showListItemActions) {
            return;
        }

        const actions: TableActionsInterface[] = [
            {
                hidden: (): boolean => !isFeatureEnabled(featureConfig?.users,
                    UserManagementConstants.FEATURE_DICTIONARY.get("USER_READ")),
                icon: (user: UserBasicInterface): SemanticICONS => {
                    const userStore = user?.userName?.split("/").length > 1
                        ? user?.userName?.split("/")[0]
                        : "PRIMARY";

                    return !hasRequiredScopes(featureConfig?.users, featureConfig?.users?.scopes?.update, allowedScopes)
                    || !isFeatureEnabled(featureConfig?.users,
                        UserManagementConstants.FEATURE_DICTIONARY.get("USER_UPDATE"))
                    || readOnlyUserStores?.includes(userStore.toString())
                        ? "eye"
                        : "pencil alternate";
                },
                "data-testid": "consumer-users-list-item-edit-button",
                onClick: (e: SyntheticEvent, user: UserBasicInterface): void =>
                    handleUserEdit(user?.id),
                popupText: (user: UserBasicInterface): string => {
                    const userStore = user?.userName?.split("/").length > 1
                        ? user?.userName?.split("/")[0]
                        : "PRIMARY";

                    return !hasRequiredScopes(featureConfig?.users, featureConfig?.users?.scopes?.update, allowedScopes)
                    || !isFeatureEnabled(featureConfig?.users,
                        UserManagementConstants.FEATURE_DICTIONARY.get("USER_UPDATE"))
                    || readOnlyUserStores?.includes(userStore.toString())
                        ? t("common:view")
                        : t("common:edit");
                },
                renderer: "semantic-icon"
            }
        ];

        actions.push({
            hidden: (user: UserBasicInterface): boolean => {
                const userStore = user?.userName?.split("/").length > 1
                    ? user?.userName?.split("/")[0]
                    : UserstoreConstants.PRIMARY_USER_STORE;

                return !isFeatureEnabled(featureConfig?.users,
                    UserManagementConstants.FEATURE_DICTIONARY.get("USER_DELETE"))
                    || !hasRequiredScopes(featureConfig?.users, featureConfig?.users?.scopes?.delete, allowedScopes)
                    || readOnlyUserStores?.includes(userStore.toString())
                    || user.userName === realmConfigs?.adminUser
                    || user.userName === authenticatedUser;
            },
            icon: (): SemanticICONS => "trash alternate",
            "data-testid": "consumer-users-list-item-delete-button",
            onClick: (e: SyntheticEvent, user: UserBasicInterface): void => {
                setShowDeleteConfirmationModal(true);
                setDeletingUser(user);
            },
            popupText: (): string => t("console:manage.features.users.usersList.list.iconPopups.delete"),
            renderer: "semantic-icon"
        });

        return actions;
    };

    /**
     * Shows list placeholders.
     *
     * @return {React.ReactElement}
     */
    const showPlaceholders = (): ReactElement => {
        // When the search returns empty.
        if (searchQuery && usersList?.totalResults === 0) {
            return (
                <EmptyPlaceholder
                    action={ (
                        <LinkButton onClick={ onSearchQueryClear }>
                            { t("console:manage.features.users.usersList.search.emptyResultPlaceholder.clearButton") }
                        </LinkButton>
                    ) }
                    image={ getEmptyPlaceholderIllustrations().emptySearch }
                    imageSize="tiny"
                    title={ t("console:manage.features.users.usersList.search.emptyResultPlaceholder.title") }
                    subtitle={ [
                        t("console:manage.features.users.usersList.search.emptyResultPlaceholder.subTitle.0",
                            { query: searchQuery }),
                        t("console:manage.features.users.usersList.search.emptyResultPlaceholder.subTitle.1")
                    ] }
                />
            );
        }

        if (usersList?.totalResults === 0) {
            return (
                <EmptyPlaceholder
                    data-testid={ `${ testId }-empty-placeholder` }
                    image={ getEmptyPlaceholderIllustrations().newList }
                    imageSize="tiny"
                    subtitle={ [ "There are no customer users available at the moment." ] }
                />
            );
        }

        return null;
    };

    return (
        <>
            <DataTable<UserBasicInterface>
                className="users-table"
                externalSearch={ advancedSearch }
                isLoading={ isLoading }
                loadingStateOptions={ {
                    count: defaultListItemLimit ?? UIConstants.DEFAULT_RESOURCE_LIST_ITEM_LIMIT,
                    imageType: "circular"
                } }
                actions={ resolveTableActions() }
                columns={ resolveTableColumns() }
                data={ usersList.Resources }
                onColumnSelectionChange={ onColumnSelectionChange }
                onRowClick={ (e: SyntheticEvent, user: UserBasicInterface): void => {
                    handleUserEdit(user?.id);
                    onListItemClick && onListItemClick(e, user);
                } }
                placeholders={ showPlaceholders() }
                selectable={ selection }
                showHeader={ true }
                transparent={ !isLoading && (showPlaceholders() !== null) }
                data-testid={ testId }
            />
            {
                deletingUser && (
                    <ConfirmationModal
                        data-testid={ `${ testId }-confirmation-modal` }
                        onClose={ (): void => setShowDeleteConfirmationModal(false) }
                        type="warning"
                        open={ showDeleteConfirmationModal }
                        assertionHint={ t("console:manage.features.user.deleteUser.confirmationModal.assertionHint") }
                        assertionType="checkbox"
                        primaryAction="Confirm"
                        secondaryAction="Cancel"
                        onSecondaryActionClick={ (): void => setShowDeleteConfirmationModal(false) }
                        onPrimaryActionClick={ (): void => deleteUser(deletingUser.id) }
                        closeOnDimmerClick={ false }
                    >
                        <ConfirmationModal.Header data-testid={ `${ testId }-confirmation-modal-header` }>
                            { t("console:manage.features.user.deleteUser.confirmationModal.header") }
                        </ConfirmationModal.Header>
                        <ConfirmationModal.Message
                            data-testid={ `${ testId }-confirmation-modal-message` }
                            attached
                            warning
                        >
                            { t("console:manage.features.user.deleteUser.confirmationModal.message") }
                        </ConfirmationModal.Message>
                        <ConfirmationModal.Content data-testid={ `${ testId }-confirmation-modal-content` }>
                            {
                                deletingUser[ SCIMConfigs.scim.enterpriseSchema ]?.userSourceId
                                    ? t("console:manage.features.user.deleteJITUser.confirmationModal.content")
                                    : t("console:manage.features.user.deleteUser.confirmationModal.content")
                            }
                        </ConfirmationModal.Content>
                    </ConfirmationModal>
                )
            }
        </>
    );
};

/**
 * Default props for the component.
 */
ConsumerUsersList.defaultProps = {
    selection: true,
    showListItemActions: true,
    showMetaContent: true
};
