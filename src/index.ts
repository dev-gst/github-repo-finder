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

    const buttonDiv: HTMLDivElement = document.createElement('div');
    buttonDiv.id = 'nav-buttons';

    const previousButton: HTMLButtonElement | null = getPreviousButton(response);
    if (previousButton) {
        buttonDiv.appendChild(previousButton);
    }

    const nextButton: HTMLButtonElement | null = getNextButton(response);
    if (nextButton) {
        buttonDiv.appendChild(nextButton);
    }

    resultDiv.appendChild(buttonDiv);
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

function getNextButton(response: Response): HTMLButtonElement | null {
    const links: string | null = response.headers.get('link');
    if (!links) {
        return null;
    }

    let rawLink: string | undefined = links.split(',').find((link: string) => link.includes('rel="next"'));
    if (!rawLink) {
        return null;
    }

    const match: RegExpMatchArray | null = rawLink.match(/<(.+)>/);
    if (!match) {
        return null;
    }

    const nextLink: string = match[1];

    const a = document.createElement('a');
    a.href = nextLink;

    const button = document.createElement('button');
    button.textContent = 'Next';
    button.id = 'next-button';
    button.addEventListener('click', async (e: Event) => {
        e.preventDefault();
        const request: Request = buildRequest(nextLink);
        const response: Response = await fetch(request);
        await buildResponse(response);
    });

    return button;
}

function getPreviousButton(response: Response): HTMLButtonElement | null {
    const links: string | null = response.headers.get('link');
    if (!links) {
        return null;
    }

    let rawLink: string | undefined = links.split(',').find((link: string) => link.includes('rel="prev"'));
    if (!rawLink) {
        return null;
    }

    const match: RegExpMatchArray | null = rawLink.match(/<(.+)>/);
    if (!match) {
        return null;
    }

    const prevLink: string = match[1];

    const a = document.createElement('a');
    a.href = prevLink;

    const button = document.createElement('button');
    button.textContent = 'Previous';
    button.id = 'prev-button';
    button.addEventListener('click', async (e: Event) => {
        e.preventDefault();
        const request: Request = buildRequest(prevLink);
        const response: Response = await fetch(request);
        await buildResponse(response);
    });

    return button;
}
