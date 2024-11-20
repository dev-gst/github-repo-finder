const githubAPIURL: string = 'https://api.github.com/search/repositories?q=';

const form: HTMLFormElement = document.getElementById('search-form') as HTMLFormElement;
form.addEventListener('submit', searchGithub);

const toggleFiltersButton: HTMLButtonElement = document.getElementById('toggle-filters') as HTMLButtonElement;
toggleFiltersButton.addEventListener('click', toggleFilters);

type FilterOptions = {
    byLanguage: string,
    byMinCreationDate: string,
    byMaxCreationDate: string,
}

type QueryFields = {
    search: string,
    page: number,
    order: string,
    sort: string,
    filterOptions: FilterOptions
};

async function searchGithub(e: Event): Promise<void> {
    e.preventDefault();
    
    const form: HTMLFormElement = document.getElementById('search-form') as HTMLFormElement;
    const search: HTMLInputElement = document.getElementById('search') as HTMLInputElement;
    const order: HTMLSelectElement = document.getElementById('order') as HTMLSelectElement;
    const sort: HTMLSelectElement = document.getElementById('sort') as HTMLSelectElement;
    const filterOptions: HTMLCollectionOf<HTMLDivElement> = document.getElementsByClassName('filter-item') as HTMLCollectionOf<HTMLDivElement>;

    const searchValue: string = search.value;
    if (!searchValue) {
        return;
    }

    const orderValue: string = parserOrder(order.value);
    const sortValue: string =  parserSort(sort.value);
    const filterOptionsValue: FilterOptions = parseFilters(filterOptions);
    
    const queryFields: QueryFields =  {
        search: searchValue,
        page: 1,
        order: orderValue,
        sort: sortValue,
        filterOptions: {
            byLanguage: filterOptionsValue.byLanguage,
            byMinCreationDate: filterOptionsValue.byMinCreationDate,
            byMaxCreationDate: filterOptionsValue.byMaxCreationDate
        }
    };

    const query: string = buildQuery(queryFields);
    const request: Request = buildRequest(query);

    const response: Response = await fetch(request);
    await buildResponse(response);

    console.log(query);
}

function buildQuery(query: QueryFields): string {
    const perPage: number = 10;
    let filters: string = ''

    if (query.filterOptions.byLanguage) {
        filters = filters.concat(`+language:${query.filterOptions.byLanguage}`);
    }

    if (query.filterOptions.byMinCreationDate && query.filterOptions.byMaxCreationDate) {
        filters = filters.concat(`+created:${query.filterOptions.byMinCreationDate}..${query.filterOptions.byMaxCreationDate}`);
    } else if (query.filterOptions.byMinCreationDate) {
        filters = filters.concat(`+created:>${query.filterOptions.byMinCreationDate}`);
    } else if (query.filterOptions.byMaxCreationDate) {
        filters = filters.concat(`+created:<${query.filterOptions.byMaxCreationDate}`);
    }

    const finalQuery: string = `${query.search}${filters}&sort=${query.sort}&order=${query.order}&per_page=${perPage}&page=${query.page}`;

    return githubAPIURL + finalQuery;
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

    console.log(data);
    resultDiv.innerHTML = parseData(data.items).innerHTML;

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

function parseData(items: any[]): HTMLDivElement {
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

function parserOrder(orderValue: string): string {
    if (orderValue !== 'asc' && orderValue !== 'desc') {
        orderValue = 'desc';
    }

    return orderValue;
}

function parserSort(sortValue: string): string {
    if (sortValue !== 'stars' &&
        sortValue !== 'forks' &&
        sortValue !== 'updated' &&
        sortValue !== 'help-wanted-issues'
    ) {
        sortValue = 'stars';
    }

    return sortValue;
}

function parseFilters(filterOptions: HTMLCollectionOf<HTMLDivElement>): FilterOptions {
    const filterOptionsValue: FilterOptions = {
        byLanguage: '',
        byMinCreationDate: '',
        byMaxCreationDate: ''
    };

    for (let div of filterOptions) {
        const value: string = div.getElementsByTagName('input')[0].value;
        const filter: string = div.getElementsByTagName('input')[0].id;

        switch (filter) {
            case 'language':
                filterOptionsValue.byLanguage = value;
                break;
            case 'min-creation-date':
                filterOptionsValue.byMinCreationDate = value;
                break;
            case 'max-creation-date':
                filterOptionsValue.byMaxCreationDate = value;
                break;
        }
    }

    return filterOptionsValue;
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

function toggleFilters(e: Event): void {
    e.preventDefault();
    const advancedOptions: HTMLDivElement = document.getElementById('advanced-options') as HTMLDivElement;
    advancedOptions.classList.toggle('hidden');
    advancedOptions.classList.toggle('filter-container');
}
