import { h } from 'dom-chef';
import { ago } from 'time-ago';

import getApiToken from '../get-api-token';
import logger from '../logger';

import { getRepoURL } from '../page-detect';

import './source-branch.css';
import linkifyTargetBranch from '../linkify-target-branch/linkify-target-branch';

const repoUrl = getRepoURL();

const getPrData = async prId => {
    const repoUrl = getRepoURL();
    const url = `https://api.bitbucket.org/2.0/repositories/${repoUrl}/pullrequests/${prId}`;
    const token = getApiToken();
    const response = await fetch(url, {
        headers: new Headers({
            Authorization: `Bearer ${token}`
        })
    });
    return await response.json();
};

export const getPrSourceBranch = async prData => {
    if (prData.error) {
        logger.error(
            `refined-bitbucket(source-branch): ${prData.error.message}`
        );
        return;
    }

    return prData.source.branch.name;
};

const buildSourceBranchNode = branchName => {
    return (
        <span class="__rbb-pull-request-source-branch">
            <span class="ref-label">
                <span class="ref branch">
                    <span class="name" aria-label={`branch ${branchName}`}>
                        <a
                            style={{ color: '#707070' }}
                            title={branchName}
                            href={`https://bitbucket.org/${repoUrl}/branch/${branchName}`}
                        >
                            {branchName}
                        </a>
                    </span>
                </span>
            </span>
        </span>
    );
};

const addSourceBranch = async (prNode, prData) => {
    const sourceBranchName = await getPrSourceBranch(prData);

    if (!sourceBranchName) {
        return;
    }

    const sourceBranchNode = buildSourceBranchNode(sourceBranchName);
    const arrow = prNode.querySelector(
        'span.aui-iconfont-devtools-arrow-right'
    );
    arrow.parentElement.insertBefore(sourceBranchNode, arrow);
};

const addDate = async (prNode, prData) => {
    const prNumberAndTimestamp = prNode.querySelector(
        '.pr-number-and-timestamp'
    );

    const date = new Date(prData.created_on);
    const dateString = date.toDateString();
    const creationDateNode = (
        <div title={dateString} datetime={prData.created_on}>
            Created on {dateString} ({ago(date)})
        </div>
    );

    prNumberAndTimestamp.append(<br />);
    prNumberAndTimestamp.appendChild(creationDateNode);
};

export default async function augmentPrEntry(prNode) {
    linkifyTargetBranch(prNode);

    const prId = prNode.dataset.pullRequestId;
    const prData = await getPrData(prId);

    await addSourceBranch(prNode, prData);
    await addDate(prNode, prData);
}
