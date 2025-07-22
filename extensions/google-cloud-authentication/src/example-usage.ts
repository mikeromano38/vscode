/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { GoogleCloudService } from './googleCloudService';

/**
 * Example: How other extensions can use the Google Cloud authentication service
 */
export class GoogleCloudExampleUsage {
	private readonly gcpService: GoogleCloudService;

	constructor() {
		this.gcpService = GoogleCloudService.getInstance();
	}

	/**
	 * Example: List all Google Cloud projects
	 */
	public async listProjects(): Promise<void> {
		try {
			// Check if user is authenticated
			if (!await this.gcpService.isAuthenticated()) {
				const result = await vscode.window.showInformationMessage(
					'You need to authenticate with Google Cloud first.',
					'Sign In'
				);
				if (result === 'Sign In') {
					await this.gcpService.authenticate();
				} else {
					return;
				}
			}

			// Get list of projects
			const projects = await this.gcpService.getProjects();
			
			if (projects.length === 0) {
				vscode.window.showInformationMessage('No projects found.');
				return;
			}

			// Show projects in a quick pick
			const selectedProject = await vscode.window.showQuickPick(
				projects.map(p => ({
					label: p.name || p.projectId,
					description: p.projectId,
					detail: p.projectNumber ? `Project Number: ${p.projectNumber}` : ''
				})),
				{
					placeHolder: 'Select a Google Cloud project'
				}
			);

			if (selectedProject) {
				// Set the selected project as current
				await this.gcpService.setCurrentProject(selectedProject.description);
				vscode.window.showInformationMessage(`Selected project: ${selectedProject.label}`);
			}
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to list projects: ${error}`);
		}
	}

	/**
	 * Example: Get current project information
	 */
	public async showCurrentProject(): Promise<void> {
		try {
			const project = await this.gcpService.getCurrentProject();
			
			if (!project) {
				vscode.window.showInformationMessage('No project selected. Use "Select Project" command first.');
				return;
			}

			// Get detailed project information
			const projectInfo = await this.gcpService.getProjectInfo(project.projectId);
			
			const message = `Current Project: ${projectInfo.name || project.projectId}
Project ID: ${project.projectId}
Region: ${project.region}
Project Number: ${projectInfo.projectNumber || 'N/A'}
Created: ${projectInfo.createTime || 'N/A'}`;

			vscode.window.showInformationMessage(message);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to get project info: ${error}`);
		}
	}

	/**
	 * Example: List Compute Engine instances
	 */
	public async listComputeInstances(): Promise<void> {
		try {
			const project = await this.gcpService.getCurrentProject();
			
			if (!project) {
				vscode.window.showInformationMessage('No project selected. Please select a project first.');
				return;
			}

			// Make authenticated request to Compute Engine API
			const response = await this.gcpService.makeAuthenticatedRequest(
				`https://compute.googleapis.com/compute/v1/projects/${project.projectId}/aggregated/instances`
			);

			if (!response.ok) {
				throw new Error(`API request failed: ${response.status} ${response.statusText}`);
			}

			const data = await response.json() as any;
			const instances = data.items ? Object.values(data.items).flatMap((zone: any) => zone.instances || []) : [];

			if (instances.length === 0) {
				vscode.window.showInformationMessage('No Compute Engine instances found.');
				return;
			}

			// Show instances in a quick pick
			const selectedInstance = await vscode.window.showQuickPick(
				instances.map((instance: any) => ({
					label: instance.name,
					description: instance.machineType?.split('/').pop() || 'Unknown type',
					detail: `${instance.status} - ${instance.zone?.split('/').pop() || 'Unknown zone'}`
				})),
				{
					placeHolder: 'Select a Compute Engine instance'
				}
			);

			if (selectedInstance) {
				vscode.window.showInformationMessage(`Selected instance: ${selectedInstance.label}`);
			}
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to list instances: ${error}`);
		}
	}

	/**
	 * Example: Check authentication status
	 */
	public async checkAuthStatus(): Promise<void> {
		const isAuthenticated = await this.gcpService.isAuthenticated();
		const project = await this.gcpService.getCurrentProject();
		
		let message = `Authentication Status: ${isAuthenticated ? '✅ Authenticated' : '❌ Not authenticated'}`;
		
		if (project) {
			message += `\nCurrent Project: ${project.projectId}`;
			message += `\nRegion: ${project.region}`;
		} else {
			message += '\nNo project selected';
		}

		vscode.window.showInformationMessage(message);
	}

	/**
	 * Example: Register commands for the extension
	 */
	public registerCommands(context: vscode.ExtensionContext): void {
		context.subscriptions.push(
			vscode.commands.registerCommand('gcp-example.listProjects', () => {
				this.listProjects();
			})
		);

		context.subscriptions.push(
			vscode.commands.registerCommand('gcp-example.showCurrentProject', () => {
				this.showCurrentProject();
			})
		);

		context.subscriptions.push(
			vscode.commands.registerCommand('gcp-example.listInstances', () => {
				this.listComputeInstances();
			})
		);

		context.subscriptions.push(
			vscode.commands.registerCommand('gcp-example.checkAuthStatus', () => {
				this.checkAuthStatus();
			})
		);
	}
} 