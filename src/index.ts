const githubAPIURL: string = 'https://api.github.com/search/repositories?q=';

const form: HTMLFormElement = document.getElementById('search-form') as HTMLFormElement;
form.addEventListener('submit', searchGithub);

async function searchGithub(e: Event): Promise<void> {
    e.preventDefault();
    
    const form: HTMLFormElement = document.getElementById('search-form') as HTMLFormElement;
    const search: HTMLInputElement = document.getElementById('search') as HTMLInputElement;

    // TODO: const searchValue: string = search.value;
    const searchValue: string = 'react';
    if (!searchValue) {
        return;
    }

    const query: string = buildQuery(searchValue, 1);
    const request: Request = buildRequest(query);

    const response: Response = await fetch(request);
    await buildResponse(response);
}

function buildQuery(searchValue: string, page: number): string {
    return githubAPIURL + `${searchValue}&sort=stars&order=desc&per_page=10&page=${page}`;
}

function buildRequest(url: string): Request {
    return new Request(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
        },
    });
}

async function buildResponse(response: Response): Promise<void> {
    const resultDiv: HTMLDivElement = document.getElementById('result') as HTMLDivElement;
    if (!response.ok) {
        resultDiv.innerHTML = `Error: ${response.statusText}`;
        return;
    }

    const data = await response.json();
    resultDiv.innerHTML = getData(data.items).innerHTML;
}

function getData(items: any[]): HTMLDivElement {
    const resultDiv: HTMLDivElement = document.createElement('div');

    items.forEach((item: any) => {
        const repoDiv: HTMLDivElement = document.createElement('div');
        repoDiv.classList.add('repo');

        const repoName: HTMLHeadElement = document.createElement('h2');
        repoName.textContent = item.full_name;

        const repoDescription: HTMLParagraphElement = document.createElement('p');
        repoDescription.textContent = item.description;

        const repoLink: HTMLAnchorElement = document.createElement('a');
        repoLink.href = item.html_url;
        repoLink.textContent = 'Github Link';

        repoDiv.appendChild(repoName);
        repoDiv.appendChild(repoDescription);
        repoDiv.appendChild(repoLink);

        resultDiv.appendChild(repoDiv);
    });

    return resultDiv;
}