"use strict";
/**
 * Tests for SkillManager and TMLEnhancedAgent
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const skill_manager_1 = require("../skill_manager");
const skill_enhanced_agent_1 = require("../../agents/skill_enhanced_agent");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Mock fs operations
globals_1.jest.mock('fs');
(0, globals_1.describe)('SkillManager', () => {
    let skillManager;
    const mockSkillsDir = '/mock/skills';
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
        skillManager = new skill_manager_1.SkillManager(mockSkillsDir);
    });
    (0, globals_1.describe)('initialization', () => {
        (0, globals_1.it)('should create skill manager instance', () => {
            (0, globals_1.expect)(skillManager).toBeInstanceOf(skill_manager_1.SkillManager);
            (0, globals_1.expect)(skillManager.skills_dir).toBeDefined();
        });
        (0, globals_1.it)('should have empty skills initially if directory does not exist', () => {
            (0, globals_1.expect)(skillManager.list_skills()).toEqual([]);
        });
    });
    (0, globals_1.describe)('load_skills_metadata', () => {
        (0, globals_1.it)('should load skill metadata from SKILL.md files', () => {
            // Mock directory listing and file reading
            const mockSkillMD = `---
name: "Test Skill"
description: "A test skill for testing"
---
# Test Skill Content`;
            globals_1.jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            globals_1.jest.spyOn(path.prototype, 'isDirectory').mockReturnValue(true);
            globals_1.jest.spyOn(path.prototype, 'iterdir').mockReturnValue([
                { name: 'SKILL.md', isFile: () => true }
            ]);
            globals_1.jest.spyOn(fs, 'readFileSync').mockReturnValue(mockSkillMD);
            skillManager.reload_skills();
            (0, globals_1.expect)(skillManager.list_skills()).toContain('Test Skill');
        });
        (0, globals_1.it)('should skip directories without SKILL.md', () => {
            globals_1.jest.spyOn(path.prototype, 'existsSync').mockReturnValue(false);
            skillManager.reload_skills();
            (0, globals_1.expect)(skillManager.list_skills()).toEqual([]);
        });
    });
    (0, globals_1.describe)('get_relevant_skills', () => {
        (0, globals_1.beforeEach)(() => {
            // Add mock skills
            skillManager.skills['React Development'] = new skill_manager_1.Skill('React Development', 'Best practices for React components', path('/mock/react'), {});
            skillManager.skills['Node.js API'] = new skill_manager_1.Skill('Node.js API', 'Building backend APIs with Node.js and Express', path('/mock/nodejs'), {});
            skillManager.skills['Python Django'] = new skill_manager_1.Skill('Python Django', 'Django web framework for Python', path('/mock/python'), {});
        });
        (0, globals_1.it)('should find skills with keyword matching', () => {
            const relevant = skillManager.get_relevant_skills('Build a React component for user login', 2);
            (0, globals_1.expect)(relevant).toContain('React Development');
        });
        (0, globals_1.it)('should return skills ordered by relevance', () => {
            const relevant = skillManager.get_relevant_skills('Create a React component with Node.js backend', 3);
            // React should come first (exact match)
            (0, globals_1.expect)(relevant[0]).toBe('React Development');
            (0, globals_1.expect)(relevant).toContain('Node.js API');
        });
        (0, globals_1.it)('should respect threshold parameter', () => {
            const relevant = skillManager.get_relevant_skills('Build a Go microservice', 2, 0.5 // Higher threshold
            );
            // Should return fewer or no skills due to high threshold
            (0, globals_1.expect)(relevant.length).toBeLessThanOrEqual(2);
        });
    });
    (0, globals_1.describe)('load_skill', () => {
        (0, globals_1.it)('should load full skill content on first call', () => {
            const mockSkill = skillManager.skills['React Development'];
            mockSkill.content = null;
            const mockContent = '# React Development\n\nBest practices...';
            globals_1.jest.spyOn(fs, 'readFileSync').mockReturnValue(`---\nname: "React Development"\ndescription: "Best practices"\n---\n${mockContent}`);
            const loaded = skillManager.load_skill('React Development');
            (0, globals_1.expect)(loaded.content).toBe(mockContent);
            (0, globals_1.expect)(loaded.loaded_at).toBeDefined();
        });
        (0, globals_1.it)('should return cached content on subsequent calls', () => {
            const mockSkill = skillManager.skills['React Development'];
            mockSkill.content = 'Cached content';
            const loaded1 = skillManager.load_skill('React Development');
            const loaded2 = skillManager.load_skill('React Development');
            (0, globals_1.expect)(loaded1).toBe(loaded2);
            (0, globals_1.expect)(loaded1.content).toBe('Cached content');
        });
        (0, globals_1.it)('should throw error for non-existent skill', () => {
            (0, globals_1.expect)(() => {
                skillManager.load_skill('Non-existent Skill');
            }).toThrow("Skill 'Non-existent Skill' not found");
        });
    });
    (0, globals_1.describe)('validate_skill', () => {
        (0, globals_1.it)('should return validation results for existing skill', () => {
            const mockSkill = skillManager.skills['React Development'];
            globals_1.jest.spyOn(skillManager, 'list_additional_files').mockReturnValue([]);
            const validation = skillManager.validate_skill('React Development');
            (0, globals_1.expect)(validation).toHaveProperty('exists', true);
            (0, globals_1.expect)(validation).toHaveProperty('has_name', true);
            (0, globals_1.expect)(validation).toHaveProperty('has_description', true);
        });
        (0, globals_1.it)('should return all false for non-existent skill', () => {
            const validation = skillManager.validate_skill('Non-existent');
            (0, globals_1.expect)(validation.exists).toBe(false);
            (0, globals_1.expect)(validation.has_skill_md).toBe(false);
        });
    });
});
(0, globals_1.describe)('TMLEnhancedAgent', () => {
    let agent;
    (0, globals_1.beforeEach)(() => {
        agent = new skill_enhanced_agent_1.TMLEnhancedAgent('frontend-agent', 'anthropic', 'claude-sonnet-4', 'mock-skills', ['React Frontend Development', 'TypeScript Best Practices']);
    });
    (0, globals_1.describe)('initialization', () => {
        (0, globals_1.it)('should create agent with configuration', () => {
            (0, globals_1.expect)(agent.agent_id).toBe('frontend-agent');
            (0, globals_1.expect)(agent.provider).toBe('anthropic');
            (0, globals_1.expect)(agent.model).toBe('claude-sonnet-4');
        });
        (0, globals_1.it)('should initialize with assigned skills', () => {
            (0, globals_1.expect)(agent.assigned_skills).toContain('React Frontend Development');
            (0, globals_1.expect)(agent.assigned_skills).toContain('TypeScript Best Practices');
        });
    });
    (0, globals_1.describe)('execute_task', () => {
        (0, globals_1.it)('should execute task with relevant skills', async () => {
            const task = {
                description: 'Build a React login form component',
                context: 'Must include email and password fields',
                requirements: 'Use TypeScript and Material-UI'
            };
            // Mock skill loading
            globals_1.jest.spyOn(agent, '_get_relevant_skills').mockReturnValue([]);
            // Mock LLM call
            globals_1.jest.spyOn(agent, '_execute_llm_call').mockReturnValue({
                success: true,
                output: 'React component code...',
                tokens_used: 150,
                cost: 0.015,
                execution_time: 3.2
            });
            const result = agent.execute_task(task);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.output).toBeDefined();
        });
        (0, globals_1.it)('should remember successful patterns', () => {
            const task = { description: 'Test task' };
            globals_1.jest.spyOn(agent, '_get_relevant_skills').mockReturnValue([]);
            globals_1.jest.spyOn(agent, '_execute_llm_call').mockReturnValue({
                success: true,
                output: 'Success'
            });
            globals_1.jest.spyOn(agent, '_remember_success_pattern').mockImplementation(() => { });
            agent.execute_task(task);
            (0, globals_1.expect)(agent._remember_success_pattern).toHaveBeenCalled();
        });
    });
    (0, globals_1.describe)('skill management', () => {
        (0, globals_1.it)('should add skill to agent', () => {
            agent.add_skill('Jest Testing');
            (0, globals_1.expect)(agent.assigned_skills).toContain('Jest Testing');
        });
        (0, globals_1.it)('should remove skill from agent', () => {
            agent.remove_skill('TypeScript Best Practices');
            (0, globals_1.expect)(agent.assigned_skills).not.toContain('TypeScript Best Practices');
        });
        (0, globals_1.it)('should list all available skills', () => {
            globals_1.jest.spyOn(agent.skill_manager, 'list_skills').mockReturnValue([
                'Skill 1',
                'Skill 2',
                'Skill 3'
            ]);
            const skills = agent.list_available_skills();
            (0, globals_1.expect)(skills).toHaveLength(3);
        });
    });
    (0, globals_1.describe)('serialization', () => {
        (0, globals_1.it)('should convert to dictionary', () => {
            const dict = agent.to_dict();
            (0, globals_1.expect)(dict).toHaveProperty('agent_id', 'frontend-agent');
            (0, globals_1.expect)(dict).toHaveProperty('provider', 'anthropic');
            (0, globals_1.expect)(dict).toHaveProperty('model', 'claude-sonnet-4');
            (0, globals_1.expect)(dict).toHaveProperty('assigned_skills');
            (0, globals_1.expect)(dict).toHaveProperty('available_skills');
        });
    });
});
(0, globals_1.describe)('TMLEnhancedAgentFactory', () => {
    (0, globals_1.describe)('create_from_config', () => {
        (0, globals_1.it)('should create agent from config', () => {
            const config = {
                id: 'test-agent',
                provider: 'openai',
                model: 'gpt-4-turbo',
                skills_dir: 'test-skills',
                skills: ['Test Skill']
            };
            const agent = TMLEnhancedAgentFactory.create_from_config(config);
            (0, globals_1.expect)(agent).toBeInstanceOf(skill_enhanced_agent_1.TMLEnhancedAgent);
            (0, globals_1.expect)(agent.agent_id).toBe('test-agent');
        });
    });
    (0, globals_1.describe)('create_multiple_from_config', () => {
        (0, globals_1.it)('should create multiple agents from config list', () => {
            const configs = [
                {
                    id: 'agent-1',
                    provider: 'anthropic',
                    model: 'claude-sonnet-4',
                    skills: ['Skill A']
                },
                {
                    id: 'agent-2',
                    provider: 'openai',
                    model: 'gpt-4-turbo',
                    skills: ['Skill B']
                }
            ];
            const agents = TMLEnhancedAgentFactory.create_multiple_from_config(configs);
            (0, globals_1.expect)(agents).toHaveLength(2);
            (0, globals_1.expect)(agents[0].agent_id).toBe('agent-1');
            (0, globals_1.expect)(agents[1].agent_id).toBe('agent-2');
        });
    });
});
//# sourceMappingURL=skill_manager.test.js.map